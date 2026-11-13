import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { cn } from '@/lib/utils';

function Toggle({ className, ...props }: TogglePrimitive.Props) {
  return <TogglePrimitive data-slot="toggle" className={cn('ui-toggle', className)} {...props} />;
}

export { Toggle };
