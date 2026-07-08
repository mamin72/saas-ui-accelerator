param(
  [Parameter(Mandatory = $false)]
  [string]$Repo = "mamin72/saas-ui-accelerator"
)

$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$wikiSource = Join-Path $workspaceRoot "wiki"

if (-not (Test-Path $wikiSource)) {
  throw "Wiki source folder not found at $wikiSource"
}

$temp = Join-Path $env:TEMP ("saas-ui-accelerator_wiki_" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $temp | Out-Null

try {
  $wikiRemote = "https://github.com/$Repo.wiki.git"
  git clone $wikiRemote $temp

  Copy-Item (Join-Path $wikiSource "*.md") $temp -Force

  Push-Location $temp
  git add .

  $pending = git status --porcelain
  if ([string]::IsNullOrWhiteSpace($pending)) {
    Write-Host "No wiki changes to publish."
    return
  }

  git commit -m "docs: publish wiki pages"
  git push origin master
  Write-Host "Wiki published successfully."
  Pop-Location
}
finally {
  if (Test-Path $temp) {
    Remove-Item $temp -Recurse -Force
  }
}

