import { formControlClass, type FormControlVariant } from "@/lib/form-control";

export function Textarea({
  className,
  variant = "box",
  ...props
}: React.ComponentProps<"textarea"> & { variant?: FormControlVariant }) {
  return <textarea className={formControlClass(variant, className)} {...props} />;
}
