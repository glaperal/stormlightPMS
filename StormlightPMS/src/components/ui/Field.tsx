import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/**
 * Field wires up label + input + (hint OR error) for a11y. The single input/
 * select/textarea child is cloned and given the correct `aria-invalid`
 * and `aria-describedby` automatically — consumers do not have to remember.
 */
export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const enhancedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<Record<string, unknown>>;
    const next: Record<string, unknown> = { ...el.props };
    if (error) next['aria-invalid'] = true;
    if (describedBy) next['aria-describedby'] = describedBy;
    if (!('id' in next) || next.id === undefined || next.id === '') {
      next.id = htmlFor;
    }
    return cloneElement(el, next);
  });

  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {enhancedChildren}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
