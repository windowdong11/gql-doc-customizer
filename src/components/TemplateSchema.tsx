import { IntrospectionSchema } from "graphql"
import { useRouteMatch, useParams, Link, Switch, Route } from "react-router-dom"
import { analyzeSchemaByType, AnalyzeSchemaResult } from "../introspector/schemaInspector"

function SchemaTitle(props: { analyzeSchemaResult: Omit<AnalyzeSchemaResult, 'fields'> }) {
    const { typeName, typeKind } = props.analyzeSchemaResult
    return <h2>{typeName} : {typeKind}</h2>
}
interface SchemaContentProps { analyzeSchemaResult: AnalyzeSchemaResult, pathUrl: string, curType: string }
function SchemaContent({analyzeSchemaResult, pathUrl, curType}: SchemaContentProps) {
    const schema = analyzeSchemaResult
    if (schema.typeKind === 'Query'
        || schema.typeKind === 'Mutation'
        || schema.typeKind === 'Subscription'
        || schema.typeKind === 'Type') {
        return (
            <ul>
                {schema.fields.map(({ fieldName, args, fieldType }) => {
                    const { details, plainType } = fieldType!
                    return (
                        <li key={fieldName}>
                            {fieldName}{args && !!args.length && '('}{args && !!args.length && args.map((arg, idx, arr) => {
                                const end = (idx + 1 < arr.length && ', ')
                                const plainType = arg.fieldType!.plainType
                                const details = arg.fieldType!.details
                                return <span key={arg.fieldName}>{arg.fieldName} : {details.front}<Link to={`${pathUrl}/${plainType}`}>{plainType}</Link>{details.back}{end}</span>
                            })}{args && !!args.length && ')'} : {details.front}<Link to={`${pathUrl}/${plainType}`}>{plainType}</Link>{details.back}
                        </li>
                    )
                })}
            </ul>
        )
    }
    else if (schema.typeKind === 'Enum') {
        return (
            <div>
                <SchemaTitle analyzeSchemaResult={schema}></SchemaTitle>
                <ul>
                    {schema.fields.map(enumValue => { return <li key={enumValue.fieldName}>{enumValue.fieldName}</li> })}
                </ul>
            </div>
        )
    }
    else if (schema.typeKind === 'Union') {
        return (
            <div>
                <SchemaTitle analyzeSchemaResult={schema}></SchemaTitle>
                <ul>
                    {schema.fields.map(possibleType => {
                        const { plainType, details } = possibleType.fieldType!
                        return <li key={possibleType.fieldName}>{details.front}<Link to={`${pathUrl}/${plainType}`}>{plainType}</Link>{details.back}</li>
                    })}
                </ul>
            </div>
        )
    }
    else if (schema.typeKind === 'Input') {
        return (
            <div>
                <SchemaTitle analyzeSchemaResult={schema}></SchemaTitle>
                <ul>
                    {schema.fields.map(inputField => {
                        const { plainType, details } = inputField.fieldType!
                        return <span key={inputField.fieldName}>{inputField.fieldName} : {details.front}<Link to={`${pathUrl}/${plainType}`}>{plainType}</Link>{details.back}</span>
                    })}
                </ul>
            </div>
        )

    }
    else {
        return (
            <div>
                <SchemaTitle analyzeSchemaResult={schema}></SchemaTitle>
            </div>
        )
    }
}

export interface TemplateSchmaProps {
    schema: IntrospectionSchema
}
export default function TemplateSchema(props: TemplateSchmaProps) {
    const { url } = useRouteMatch()
    const { type } = useParams<{ type: string }>()
    const schema = analyzeSchemaByType({ schema: props.schema, curType: type })
    if (schema) {
        return (
            <div>
                <SchemaTitle analyzeSchemaResult={schema}></SchemaTitle>
                <SchemaContent analyzeSchemaResult={schema} pathUrl={url} curType={type}></SchemaContent>
                <Switch>
                    <Route path={`${url}/:type`}>
                        <TemplateSchema schema={props.schema}></TemplateSchema>
                    </Route>
                </Switch>
            </div>
        )
    }
    return <div>Schema [{type}] not found.</div>
}