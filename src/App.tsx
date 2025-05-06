import { FormEvent, useCallback, useMemo, useReducer } from 'react';
import { z } from 'zod';

// Form schema to use for validating form data
const formSchema = z.object({
  name: z.string().min(2).max(100),
  age: z.coerce.number().min(18).max(199),
});

// Initial state for the reducer
const initialFields = Object.fromEntries(Object.keys(formSchema.shape).map(k => [k, false])) as Record<keyof typeof formSchema.shape, boolean | string>

// Simple reducer function to keep track of form field states
function formFieldsReducer(
  currentState: typeof initialFields,
  nextState: Partial<typeof initialFields>
) {
  return { ...currentState, ...nextState };
}

export function App() {
  const [errors, setErrors] = useReducer(formFieldsReducer, initialFields);
  const [changed, setChanged] = useReducer(formFieldsReducer, initialFields);
  const [touched, setTouched] = useReducer(formFieldsReducer, initialFields);
  const isValid = useIsValid(errors, changed);

  const handleChange = useCallback((evt: FormEvent<HTMLFormElement>) => {
    const entries = Object.fromEntries(new FormData(evt.currentTarget).entries());
    const changed = getChangedFields(entries);
    setChanged(changed);
    try {
      formSchema.parse(entries);
      setErrors(initialFields);
    } catch (error) {
      const errors = Object.fromEntries(
        error.issues.map((issue) => [issue.path[0], issue.message])
      );
      setErrors({ ...initialFields, ...errors });
    }
  }, []);

  const handleSubmit = useCallback((evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const entries = Object.fromEntries(new FormData(evt.currentTarget).entries());
    console.log('SUBMIT', entries);
  }, []);

  return (
    <form onChange={handleChange} onSubmit={handleSubmit}>
      <div>
        <InputWithHelperText
          name="name"
          placeholder="Your name"
          onBlur={() => setTouched({ name: true })}
          touched={touched.name}
          error={errors.name}
        />
      </div>
      <div>
        <InputWithHelperText
          name="age"
          placeholder="Your age"
          onBlur={() => setTouched({ age: true })}
          touched={touched.age}
          error={errors.age}
        />
      </div>
      <button type="submit" disabled={!isValid}>
        Submit
      </button>
    </form>
  );
}

function InputWithHelperText({
  touched,
  error,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement> & {
  touched: boolean | string;
  error: boolean | string;
}) {
  return (
    <>
      <input {...inputProps} />
      {Boolean(touched) && Boolean(error) && <span>{error}</span>}
    </>
  );
}

// Utility function to determine which fields were changed
function getChangedFields(entries: Record<string, FormDataEntryValue>) {
  const changed = Object.keys(entries)
    .filter((key) => entries[key] !== '')
    .map((key) => [key, true]);
  return Object.fromEntries(changed);
}

// Hook to determine if form is valid
function useIsValid(
  errors: Record<string, boolean | string>,
  changed: Record<string, boolean | string>
) {
  return useMemo(
    () =>
      Object.keys(errors)
        .map((key) => errors[key])
        .filter((error) => Boolean(error)).length === 0 &&
      Object.keys(changed)
        .map((key) => changed[key])
        .filter((changed) => Boolean(changed)).length > 0,
    [errors, changed]
  );
}
