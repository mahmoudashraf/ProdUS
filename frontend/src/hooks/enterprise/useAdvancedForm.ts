import { FormEvent, useCallback, useMemo, useState } from 'react';
import type { UseAdvancedFormOptions } from '@/types/components';
import { validateForm, ValidationErrors } from '@/types/validation';

export function useAdvancedForm<TForm extends object>({
  initialValues,
  validationRules = {},
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
}: UseAdvancedFormOptions<TForm>) {
  const [values, setValuesState] = useState<TForm>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<TForm>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof TForm, boolean>>>({});
  const [isSubmitting, setSubmitting] = useState(false);

  const runValidation = useCallback(
    (nextValues: TForm) => {
      const nextErrors = validateForm(nextValues, validationRules);
      setErrors(nextErrors);
      return nextErrors;
    },
    [validationRules]
  );

  const setValue = useCallback(
    <K extends keyof TForm>(field: K, value: TForm[K]) => {
      setValuesState((current) => {
        const nextValues = { ...current, [field]: value };
        if (validateOnChange) {
          runValidation(nextValues);
        }
        return nextValues;
      });
    },
    [runValidation, validateOnChange]
  );

  const setValues = useCallback(
    (nextValues: TForm) => {
      setValuesState(nextValues);
      if (validateOnChange) {
        runValidation(nextValues);
      }
    },
    [runValidation, validateOnChange]
  );

  const setError = useCallback(<K extends keyof TForm>(field: K, error: string) => {
    setErrors((current) => ({ ...current, [field]: error }));
  }, []);

  const handleChange = useCallback(
    <K extends keyof TForm>(field: K, value: TForm[K]) => {
      setValue(field, value);
    },
    [setValue]
  );

  const handleBlur = useCallback(
    (field: keyof TForm) => {
      setTouched((current) => ({ ...current, [field]: true }));
      if (validateOnBlur) {
        runValidation(values);
      }
    },
    [runValidation, validateOnBlur, values]
  );

  const resetForm = useCallback(
    (nextValues: TForm = initialValues) => {
      setValuesState(nextValues);
      setErrors({});
      setTouched({});
      setSubmitting(false);
    },
    [initialValues]
  );

  const handleSubmit = useCallback(
    (submitHandler?: (values: TForm) => Promise<void> | void) => async (event?: FormEvent) => {
      event?.preventDefault();
      const nextErrors = runValidation(values);
      if (Object.keys(nextErrors).length > 0) {
        setTouched(
          Object.keys(nextErrors).reduce(
            (accumulator, key) => ({ ...accumulator, [key]: true }),
            {} as Partial<Record<keyof TForm, boolean>>
          )
        );
        return;
      }

      const handler = submitHandler || onSubmit;
      if (!handler) {
        return;
      }

      setSubmitting(true);
      try {
        await handler(values);
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, runValidation, values]
  );

  const isDirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initialValues), [initialValues, values]);
  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isDirty,
    isValid,
    isSubmitting,
    setValue,
    setValues,
    setError,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    validate: () => runValidation(values),
  };
}
