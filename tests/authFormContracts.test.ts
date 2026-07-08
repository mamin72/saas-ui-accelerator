import { describe, expect, it } from 'vitest';
import {
  createAuthSubmissionContract,
  createSignInFormSchema,
  createSignUpFormSchema,
  mapAuthProviderError,
  mapAuthValidationIssuesToFieldErrors,
  validateAuthFormValues,
} from '../src/index';

describe('auth form contracts', () => {
  it('creates sign-in schema with defaults and normalizes parsed values', () => {
    const schema = createSignInFormSchema();

    expect(schema.flow).toBe('sign-in');
    expect(schema.fields.map((field) => field.name)).toEqual(['email', 'password', 'rememberMe']);

    const parsed = schema.parse({
      email: '  USER@Example.COM ',
      password: '  pass12345  ',
      rememberMe: true,
    });

    expect(parsed).toEqual({
      email: 'user@example.com',
      password: 'pass12345',
      rememberMe: true,
      tenantId: undefined,
    });
  });

  it('creates sign-in schema with tenant id and no remember-me', () => {
    const schema = createSignInFormSchema({ includeTenantId: true, allowRememberMe: false });

    expect(schema.fields.map((field) => field.name)).toEqual(['email', 'password', 'tenantId']);

    const parsed = schema.parse({
      email: 'user@example.com',
      password: 'password-123',
      tenantId: '  team-01 ',
    });

    expect(parsed.tenantId).toBe('team-01');
    expect(parsed.rememberMe).toBe(false);
  });

  it('normalizes optional/non-string parse values defensively', () => {
    const schema = createSignInFormSchema({ includeTenantId: true });

    const parsed = schema.parse({
      email: 'USER@EXAMPLE.COM',
      password: 12345,
      rememberMe: false,
      tenantId: 99,
    });

    expect(parsed).toEqual({
      email: 'user@example.com',
      password: '',
      rememberMe: false,
      tenantId: undefined,
    });
  });

  it('validates sign-in required fields and value types', () => {
    const schema = createSignInFormSchema();

    const result = validateAuthFormValues(schema, {
      email: 'not-an-email',
      password: 123,
      rememberMe: 'yes',
    });

    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'invalid-email',
      'invalid-type',
      'invalid-type',
    ]);
  });

  it('creates a sign-in submission contract when values are valid', () => {
    const schema = createSignInFormSchema({ includeTenantId: true });

    const submission = createAuthSubmissionContract({
      schema,
      values: {
        email: ' user@example.com ',
        password: ' password-123 ',
        rememberMe: false,
        tenantId: '  tenant-7 ',
      },
      submittedAtUtc: '2026-06-01T12:00:00.000Z',
    });

    expect(submission.flow).toBe('sign-in');
    expect(submission.submittedAtUtc).toBe('2026-06-01T12:00:00.000Z');
    expect(submission.values).toEqual({
      email: 'user@example.com',
      password: 'password-123',
      rememberMe: false,
      tenantId: 'tenant-7',
    });
  });

  it('throws when submission has invalid values or timestamp', () => {
    const schema = createSignInFormSchema();

    expect(() =>
      createAuthSubmissionContract({
        schema,
        values: {
          email: '',
          password: '',
        },
        submittedAtUtc: '2026-06-01T12:00:00.000Z',
      })
    ).toThrow("Cannot create auth submission: Field 'email' is required.");

    expect(() =>
      createAuthSubmissionContract({
        schema,
        values: {
          email: 'user@example.com',
          password: 'password-123',
        },
        submittedAtUtc: 'not-a-date',
      })
    ).toThrow("Submitted timestamp 'not-a-date' is invalid.");
  });

  it('creates sign-up schema and validates optional display-name behavior', () => {
    const defaultSchema = createSignUpFormSchema();
    expect(defaultSchema.fields.find((field) => field.name === 'displayName')?.required).toBe(false);

    const requiredDisplayNameSchema = createSignUpFormSchema({ requireDisplayName: true, minPasswordLength: 10 });
    expect(requiredDisplayNameSchema.fields.find((field) => field.name === 'displayName')?.required).toBe(true);
    expect(requiredDisplayNameSchema.fields.find((field) => field.name === 'password')?.minLength).toBe(10);

    expect(() => createSignUpFormSchema({ minPasswordLength: 7 })).toThrow(
      'Sign-up minimum password length must be between 8 and 128.'
    );
  });

  it('validates sign-up constraints including length, matching, pattern, and acceptance', () => {
    const schema = createSignUpFormSchema({ requireDisplayName: true, minPasswordLength: 12 });

    const result = validateAuthFormValues(schema, {
      email: ' person@example.com ',
      password: 'short',
      confirmPassword: 'different',
      acceptTerms: false,
      displayName: 'x',
      inviteCode: 'lowercase-invalid',
    });

    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'too-short',
      'too-short',
      'field-mismatch',
      'missing-required',
      'too-short',
      'pattern-mismatch',
    ]);
  });

  it('supports valid sign-up submission parsing with optional values', () => {
    const schema = createSignUpFormSchema({ minPasswordLength: 8 });

    const validation = validateAuthFormValues(schema, {
      email: 'new@example.com',
      password: 'Password-123',
      confirmPassword: 'Password-123',
      acceptTerms: true,
      displayName: '  New User ',
      inviteCode: 'TEAM-ALPHA-01',
    });

    expect(validation.isValid).toBe(true);

    const submission = createAuthSubmissionContract({
      schema,
      values: {
        email: 'new@example.com',
        password: 'Password-123',
        confirmPassword: 'Password-123',
        acceptTerms: true,
        displayName: '  New User ',
        inviteCode: 'TEAM-ALPHA-01',
      },
    });

    expect(submission.values.displayName).toBe('New User');
    expect(submission.values.inviteCode).toBe('TEAM-ALPHA-01');
    expect(new Date(submission.submittedAtUtc).toISOString()).toBe(submission.submittedAtUtc);
  });

  it('maps validation issues to field error arrays', () => {
    const errors = mapAuthValidationIssuesToFieldErrors([
      { code: 'missing-required', field: 'email', message: 'Email required' },
      { code: 'invalid-email', field: 'email', message: 'Email invalid' },
      { code: 'too-short', field: 'password', message: 'Password too short' },
    ]);

    expect(errors).toEqual({
      email: ['Email required', 'Email invalid'],
      password: ['Password too short'],
    });
  });

  it('maps provider errors to stable UI-facing auth errors', () => {
    expect(mapAuthProviderError({ code: 'INVALID_CREDENTIALS' })).toEqual({
      code: 'INVALID_CREDENTIALS',
      fieldErrors: {
        email: ['Email or password is incorrect.'],
        password: ['Email or password is incorrect.'],
      },
      formErrors: [],
      retryable: false,
    });

    expect(mapAuthProviderError({ code: 'EMAIL_ALREADY_IN_USE' }).fieldErrors.email).toEqual([
      'This email is already associated with an account.',
    ]);

    expect(mapAuthProviderError({ code: 'WEAK_PASSWORD' }).fieldErrors.password).toEqual([
      'Password does not meet security requirements.',
    ]);

    expect(mapAuthProviderError({ code: 'MFA_REQUIRED' })).toEqual({
      code: 'MFA_REQUIRED',
      fieldErrors: {},
      formErrors: ['Additional verification is required to complete sign-in.'],
      retryable: true,
    });

    expect(mapAuthProviderError({ code: 'RATE_LIMITED' })).toEqual({
      code: 'RATE_LIMITED',
      fieldErrors: {},
      formErrors: ['Too many attempts. Please wait and try again.'],
      retryable: true,
    });

    expect(mapAuthProviderError('Temporary upstream issue')).toEqual({
      code: 'UNKNOWN',
      fieldErrors: {},
      formErrors: ['Temporary upstream issue'],
      retryable: false,
    });

    expect(
      mapAuthProviderError({
        code: 'non_standard_error',
        message: 'Something odd happened',
        retryable: true,
      })
    ).toEqual({
      code: 'NON_STANDARD_ERROR',
      fieldErrors: {},
      formErrors: ['Something odd happened'],
      retryable: true,
    });

    expect(mapAuthProviderError(42)).toEqual({
      code: 'UNKNOWN',
      fieldErrors: {},
      formErrors: ['Authentication request failed.'],
      retryable: false,
    });

    expect(mapAuthProviderError('   ')).toEqual({
      code: 'UNKNOWN',
      fieldErrors: {},
      formErrors: ['Authentication request failed.'],
      retryable: false,
    });

    expect(
      mapAuthProviderError({
        code: '   ',
        message: '   ',
      })
    ).toEqual({
      code: 'UNKNOWN',
      fieldErrors: {},
      formErrors: ['Authentication request failed.'],
      retryable: false,
    });
  });

  it('validates max-length and non-string comparison values', () => {
    const schema = createSignUpFormSchema({ minPasswordLength: 8 });
    const longInviteCode = 'A'.repeat(65);

    const result = validateAuthFormValues(schema, {
      email: 'long@example.com',
      password: 'Password-123',
      confirmPassword: 'Password-123',
      acceptTerms: true,
      inviteCode: longInviteCode,
    });

    expect(result.issues.some((issue) => issue.code === 'too-long')).toBe(true);

    const mismatch = validateAuthFormValues(schema, {
      email: 'long@example.com',
      password: 'Password-123',
      confirmPassword: 'Password-123',
      acceptTerms: true,
      displayName: 'User Name',
      inviteCode: 'CODE-123',
      passwordCopy: 10,
    });

    expect(mismatch.isValid).toBe(true);
  });
});
