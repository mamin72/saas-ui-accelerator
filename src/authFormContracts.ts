export type AuthFlowType = 'sign-in' | 'sign-up';

export type AuthFieldInputType = 'email' | 'password' | 'text' | 'checkbox' | 'hidden';

export type AuthValidationIssueCode =
  | 'missing-required'
  | 'invalid-type'
  | 'invalid-email'
  | 'too-short'
  | 'too-long'
  | 'pattern-mismatch'
  | 'field-mismatch';

export interface AuthFormFieldSchema {
  name: string;
  label: string;
  input: AuthFieldInputType;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  matchesField?: string;
}

export interface AuthFormSchema<TValues extends object = Record<string, unknown>> {
  flow: AuthFlowType;
  fields: readonly AuthFormFieldSchema[];
  parse(values: Readonly<Record<string, unknown>>): TValues;
}

export interface SignInFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
  tenantId?: string;
}

export interface SignUpFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  displayName?: string;
  inviteCode?: string;
}

export interface AuthSubmissionContract<TValues extends object> {
  flow: AuthFlowType;
  values: TValues;
  submittedAtUtc: string;
}

export interface AuthValidationIssue {
  code: AuthValidationIssueCode;
  field: string;
  message: string;
}

export interface AuthValidationResult {
  isValid: boolean;
  issues: readonly AuthValidationIssue[];
}

export interface AuthFieldErrorMap {
  [fieldName: string]: readonly string[];
}

export interface AuthErrorResolution {
  code: string;
  fieldErrors: AuthFieldErrorMap;
  formErrors: readonly string[];
  retryable: boolean;
}

export function createSignInFormSchema(input?: {
  includeTenantId?: boolean;
  allowRememberMe?: boolean;
}): AuthFormSchema<SignInFormValues> {
  const includeTenantId = input?.includeTenantId ?? false;
  const allowRememberMe = input?.allowRememberMe ?? true;

  const fields: AuthFormFieldSchema[] = [
    { name: 'email', label: 'Email', input: 'email', required: true, maxLength: 320 },
    { name: 'password', label: 'Password', input: 'password', required: true, minLength: 8, maxLength: 128 },
  ];

  if (allowRememberMe) {
    fields.push({ name: 'rememberMe', label: 'Remember me', input: 'checkbox' });
  }

  if (includeTenantId) {
    fields.push({ name: 'tenantId', label: 'Tenant ID', input: 'hidden', maxLength: 120 });
  }

  return {
    flow: 'sign-in',
    fields,
    parse(values: Readonly<Record<string, unknown>>): SignInFormValues {
      return {
        email: normalizeEmail(values.email),
        password: normalizeString(values.password),
        rememberMe: values.rememberMe === true,
        tenantId: normalizeOptionalString(values.tenantId),
      };
    },
  };
}

export function createSignUpFormSchema(input?: {
  requireDisplayName?: boolean;
  minPasswordLength?: number;
}): AuthFormSchema<SignUpFormValues> {
  const requireDisplayName = input?.requireDisplayName ?? false;
  const minPasswordLength = input?.minPasswordLength ?? 12;

  if (!Number.isFinite(minPasswordLength) || minPasswordLength < 8 || minPasswordLength > 128) {
    throw new Error('Sign-up minimum password length must be between 8 and 128.');
  }

  const fields: AuthFormFieldSchema[] = [
    { name: 'email', label: 'Email', input: 'email', required: true, maxLength: 320 },
    { name: 'password', label: 'Password', input: 'password', required: true, minLength: minPasswordLength, maxLength: 128 },
    {
      name: 'confirmPassword',
      label: 'Confirm password',
      input: 'password',
      required: true,
      minLength: minPasswordLength,
      maxLength: 128,
      matchesField: 'password',
    },
    { name: 'acceptTerms', label: 'Accept terms', input: 'checkbox', required: true },
    { name: 'displayName', label: 'Display name', input: 'text', required: requireDisplayName, minLength: 2, maxLength: 80 },
    { name: 'inviteCode', label: 'Invite code', input: 'text', maxLength: 64, pattern: /^[A-Z0-9-]+$/ },
  ];

  return {
    flow: 'sign-up',
    fields,
    parse(values: Readonly<Record<string, unknown>>): SignUpFormValues {
      return {
        email: normalizeEmail(values.email),
        password: normalizeString(values.password),
        confirmPassword: normalizeString(values.confirmPassword),
        acceptTerms: values.acceptTerms === true,
        displayName: normalizeOptionalString(values.displayName),
        inviteCode: normalizeOptionalString(values.inviteCode),
      };
    },
  };
}

export function createAuthSubmissionContract<TValues extends object>(input: {
  schema: AuthFormSchema<TValues>;
  values: Readonly<Record<string, unknown>>;
  submittedAtUtc?: string;
}): AuthSubmissionContract<TValues> {
  const submittedAtUtc = normalizeUtcTimestamp(input.submittedAtUtc ?? new Date().toISOString());
  const validation = validateAuthFormValues(input.schema, input.values);

  if (!validation.isValid) {
    const firstIssue = validation.issues[0];
    throw new Error(`Cannot create auth submission: ${firstIssue?.message ?? 'invalid form values'}.`);
  }

  return {
    flow: input.schema.flow,
    values: input.schema.parse(input.values),
    submittedAtUtc,
  };
}

export function validateAuthFormValues<TValues extends object>(
  schema: AuthFormSchema<TValues>,
  values: Readonly<Record<string, unknown>>
): AuthValidationResult {
  const issues: AuthValidationIssue[] = [];

  for (const field of schema.fields) {
    const rawValue = values[field.name];

    if (field.required) {
      if (field.input === 'checkbox') {
        if (rawValue !== true) {
          issues.push({
            code: 'missing-required',
            field: field.name,
            message: `Field '${field.name}' must be accepted.`,
          });
          continue;
        }
      } else if (isMissing(rawValue)) {
        issues.push({
          code: 'missing-required',
          field: field.name,
          message: `Field '${field.name}' is required.`,
        });
        continue;
      }
    }

    if (isMissing(rawValue)) {
      continue;
    }

    if (field.input === 'checkbox') {
      if (typeof rawValue !== 'boolean') {
        issues.push({
          code: 'invalid-type',
          field: field.name,
          message: `Field '${field.name}' must be a boolean.`,
        });
      }

      continue;
    }

    if (typeof rawValue !== 'string') {
      issues.push({
        code: 'invalid-type',
        field: field.name,
        message: `Field '${field.name}' must be a string.`,
      });
      continue;
    }

    const normalized = rawValue.trim();

    if (field.input === 'email' && !isValidEmail(normalized)) {
      issues.push({
        code: 'invalid-email',
        field: field.name,
        message: `Field '${field.name}' must contain a valid email address.`,
      });
      continue;
    }

    if (field.minLength != null && normalized.length < field.minLength) {
      issues.push({
        code: 'too-short',
        field: field.name,
        message: `Field '${field.name}' must be at least ${field.minLength} characters.`,
      });
    }

    if (field.maxLength != null && normalized.length > field.maxLength) {
      issues.push({
        code: 'too-long',
        field: field.name,
        message: `Field '${field.name}' must be at most ${field.maxLength} characters.`,
      });
    }

    if (field.pattern && !field.pattern.test(normalized)) {
      issues.push({
        code: 'pattern-mismatch',
        field: field.name,
        message: `Field '${field.name}' has an invalid format.`,
      });
    }

    if (field.matchesField) {
      const comparisonValue = values[field.matchesField];
      if (typeof comparisonValue !== 'string' || normalized !== comparisonValue.trim()) {
        issues.push({
          code: 'field-mismatch',
          field: field.name,
          message: `Field '${field.name}' must match '${field.matchesField}'.`,
        });
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

export function mapAuthValidationIssuesToFieldErrors(
  issues: readonly AuthValidationIssue[]
): AuthFieldErrorMap {
  const result: Record<string, string[]> = {};

  for (const issue of issues) {
    if (!result[issue.field]) {
      result[issue.field] = [];
    }

    result[issue.field].push(issue.message);
  }

  return result;
}

export function mapAuthProviderError(error: unknown): AuthErrorResolution {
  const normalized = normalizeProviderError(error);

  switch (normalized.code) {
    case 'INVALID_CREDENTIALS':
      return {
        code: normalized.code,
        fieldErrors: {
          email: ['Email or password is incorrect.'],
          password: ['Email or password is incorrect.'],
        },
        formErrors: [],
        retryable: false,
      };
    case 'EMAIL_ALREADY_IN_USE':
      return {
        code: normalized.code,
        fieldErrors: {
          email: ['This email is already associated with an account.'],
        },
        formErrors: [],
        retryable: false,
      };
    case 'WEAK_PASSWORD':
      return {
        code: normalized.code,
        fieldErrors: {
          password: ['Password does not meet security requirements.'],
        },
        formErrors: [],
        retryable: false,
      };
    case 'MFA_REQUIRED':
      return {
        code: normalized.code,
        fieldErrors: {},
        formErrors: ['Additional verification is required to complete sign-in.'],
        retryable: true,
      };
    case 'RATE_LIMITED':
      return {
        code: normalized.code,
        fieldErrors: {},
        formErrors: ['Too many attempts. Please wait and try again.'],
        retryable: true,
      };
    default:
      return {
        code: normalized.code,
        fieldErrors: {},
        formErrors: [normalized.message || 'Authentication request failed.'],
        retryable: normalized.retryable,
      };
  }
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeEmail(value: unknown): string {
  return normalizeString(value).toLowerCase();
}

function normalizeUtcTimestamp(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Submitted timestamp '${value}' is invalid.`);
  }

  return parsed.toISOString();
}

function isMissing(value: unknown): boolean {
  if (value == null) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  return false;
}

function isValidEmail(value: string): boolean {
  if (value.length === 0 || value.length > 320) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeProviderError(error: unknown): {
  code: string;
  message?: string;
  retryable: boolean;
} {
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN',
      message: error.trim().length > 0 ? error.trim() : 'Authentication request failed.',
      retryable: false,
    };
  }

  if (error && typeof error === 'object') {
    const asRecord = error as { code?: unknown; message?: unknown; retryable?: unknown };
    const rawCode = typeof asRecord.code === 'string' ? asRecord.code.trim().toUpperCase() : 'UNKNOWN';
    const message = typeof asRecord.message === 'string' && asRecord.message.trim().length > 0
      ? asRecord.message.trim()
      : undefined;

    return {
      code: rawCode.length > 0 ? rawCode : 'UNKNOWN',
      message,
      retryable: asRecord.retryable === true,
    };
  }

  return {
    code: 'UNKNOWN',
    message: undefined,
    retryable: false,
  };
}
