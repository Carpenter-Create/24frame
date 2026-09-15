import { formControlClass, type FormControlVariant } from "@/lib/form-control";

export function Input({
  className,
  variant = "box",
  ...props
}: React.ComponentProps<"input"> & { variant?: FormControlVariant }) {
  return <input className={formControlClass(variant, className)} {...props} />;
}
