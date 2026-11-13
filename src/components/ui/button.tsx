import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva('ui-button', {
  variants: {
    variant: {
      default: 'button-primary',
      ghost: 'button-ghost',
      link: 'button-link',
    },
    size: {
      default: 'button-default',
      hero: 'button-hero',
      icon: 'button-icon',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
