import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import type { Toggle as TogglePrimitive } from '@base-ui/react/toggle';

function ToggleGroup({ className, ...props }: ToggleGroupPrimitive.Props) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn('ui-toggle-group', className)}
      {...props}
    />
  );
}

function ToggleGroupItem(props: TogglePrimitive.Props) {
  return <Toggle data-slot="toggle-group-item" {...props} />;
}

export { ToggleGroup, ToggleGroupItem };
