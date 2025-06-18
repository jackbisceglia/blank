import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

type CollapsibleNotificationProps = {
  title: string;
  content: string | string[];
  defaultExpanded?: boolean;
};

export function CollapsibleNotification(props: CollapsibleNotificationProps) {
  return (
    <Accordion
      defaultValue={props.defaultExpanded ? "settlement-info" : ""}
      type="single"
      collapsible
      className="bg-secondary border border-accent shadow-none rounded-lg"
    >
      <AccordionItem value="settlement-info" className="border-0">
        <AccordionTrigger className="font-medium text-sm uppercase flex items-center gap-2 px-4 py-3 hover:no-underline [&>svg]:h-4 [&>svg]:w-4 focus-visible:ring-inset">
          {props.title}
        </AccordionTrigger>
        <AccordionContent className="text-xs text-secondary-foreground px-4 pb-4 pt-0.5 lowercase">
          {typeof props.content === "string" ? (
            props.content
          ) : (
            <ul className="space-y-1.5">
              {props.content.map((item) => (
                <li key={item} className="flex items-center gap-1">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
