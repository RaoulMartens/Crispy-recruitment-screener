import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
};
function describedBy(id: string, hint?: string, error?: string) {
  return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
}
export function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? <p id={`${id}-error`} className="mt-2 text-sm text-destructive">{error}</p> : null;
}
export function TextField({ id, label, value, onChange, hint, error, optional = false, disabled = false, type = "text", maxLength = 120, placeholder, autoComplete = "off", accessory }: FieldProps & {
  optional?: boolean; disabled?: boolean; type?: "text" | "email"; maxLength?: number; placeholder?: string; autoComplete?: string; accessory?: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Label htmlFor={id} className="text-sm leading-[1.45] font-medium">{label}{optional && <span className="font-normal text-muted-foreground"> (optioneel)</span>}</Label>
        {accessory}
      </div>
      <Input id={id} name={id} value={value} onChange={(event) => onChange(event.target.value)} type={type}
        inputMode={type === "email" ? "email" : "text"} required={!optional && !disabled} disabled={disabled} autoComplete={autoComplete}
        maxLength={maxLength} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={describedBy(id, hint, error)}
        className="h-12 rounded-md px-3.5 text-base md:text-base" />
      {hint && <p id={`${id}-hint`} className="mt-2 text-xs leading-[1.5] text-muted-foreground">{hint}</p>}
      <FieldError id={id} error={error} />
    </div>
  );
}
export function ChoiceField({ id, label, value, onChange, hint, error, options }: FieldProps & { options: readonly { value: string; label: string }[] }) {
  return (
    <fieldset>
      <legend id={`${id}-label`} className="mb-2 text-sm leading-[1.45] font-medium">{label}</legend>
      {hint && <p id={`${id}-hint`} className="mb-3 text-xs leading-[1.5] text-muted-foreground">{hint}</p>}
      <RadioGroup id={id} value={value} onValueChange={onChange} aria-labelledby={`${id}-label`} aria-required="true"
        aria-invalid={Boolean(error)} aria-describedby={describedBy(id, hint, error)} className="gap-2">
        {options.map((option) => <Label key={option.value} htmlFor={`${id}-${option.value}`}
          className="answer-row flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-border px-3.5 py-3 text-[0.9375rem] leading-[1.45] font-normal">
          <RadioGroupItem id={`${id}-${option.value}`} value={option.value} className="shrink-0" />
          <span>{option.label}</span>
        </Label>)}
      </RadioGroup>
      <FieldError id={id} error={error} />
    </fieldset>
  );
}
export function SelectField({ id, label, value, onChange, error, options }: FieldProps & { options: readonly string[] }) {
  return <div>
    <Label htmlFor={id} className="mb-2 block text-sm leading-[1.45] font-medium">{label}</Label>
    <div className="relative">
      <select id={id} name={id} value={value} onChange={(event) => onChange(event.target.value)} required aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-12 w-full appearance-none rounded-md border border-input bg-white pl-3.5 pr-10 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <option value="" disabled>Kies een antwoord</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground" />
    </div>
    <FieldError id={id} error={error} />
  </div>;
}
