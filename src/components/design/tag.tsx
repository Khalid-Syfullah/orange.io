import { Badge } from "@/components/ui/badge";

/** Orange.io tag: the shadcn Badge in its `tag` variant. */
export function Tag(props: Omit<React.ComponentProps<typeof Badge>, "variant">) {
  return <Badge variant="tag" {...props} />;
}
