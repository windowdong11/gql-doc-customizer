import { IntrospectionSchema } from "graphql";
import { Link } from "react-router-dom";

interface ResolverSelectorProps {
    schema: IntrospectionSchema
}
export default function ResolverSelector(props: ResolverSelectorProps) {
    return (
        <div>
            <Link to={`/${props.schema.queryType.name}`}>{props.schema.queryType.name}</Link>
            {props.schema.mutationType && <Link to={`/${props.schema.mutationType.name}`}>{props.schema.mutationType.name}</Link>}
            {props.schema.subscriptionType && <Link to={`/${props.schema.subscriptionType.name}`}>{props.schema.subscriptionType.name}</Link>}
        </div>
    )
}