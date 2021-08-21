import { getIntrospectionQuery, IntrospectionQuery, IntrospectionSchema } from 'graphql';
import { useState } from 'react';
import { BrowserRouter, Link, Route, Switch, useParams, useRouteMatch } from 'react-router-dom';
import { SchemaProps, analyzeSchemaByType, getSchemaFromEndpoint } from './schemaInspector';

function App() {
  const [endpoint, setEndpoint] = useState('http://localhost:4000')
  const [schema, setSchema] = useState<IntrospectionSchema>()
  if (schema) {
    console.log(schema)
  }
  const getSchema = () => {
    getSchemaFromEndpoint(endpoint).then(schema => setSchema(schema))
  }
  return (
    <BrowserRouter>
      <Link to="/">Home</Link>
      <input type="url" value={endpoint} onChange={e => setEndpoint(e.target.value)} onKeyPress={e => { if (e.key === "Enter") getSchema() }}></input>
      <button onClick={getSchema}>getData</button>
      <Route exact path="/">
        {schema ?
          <ResolverSelector schema={schema} />
          : <div>Schema at [{endpoint}] not found.</div>
        }
      </Route>
      <Route path="/:type">
        {schema ?
          <TemplateSchema schema={schema} />
          : <div>Schema at [{endpoint}] not found.</div>
        }
      </Route>
    </BrowserRouter>
  );
}

export default App;
interface ResolverSelectorProps {
  schema: IntrospectionSchema
}
function ResolverSelector(props: ResolverSelectorProps) {
  return (
    <div>
      <Link to={`/${props.schema.queryType.name}`}>{props.schema.queryType.name}</Link>
      {props.schema.mutationType && <Link to={`/${props.schema.mutationType.name}`}>{props.schema.mutationType.name}</Link>}
      {props.schema.subscriptionType && <Link to={`/${props.schema.subscriptionType.name}`}>{props.schema.subscriptionType.name}</Link>}
    </div>
  )
}

function TemplateSchema(props: SchemaProps) {
  const { url } = useRouteMatch()
  const { type } = useParams<{ type: string }>()
  const schema = analyzeSchemaByType({schema: props.schema, curType: type})
  if (schema) {
    let content : JSX.Element
    if (schema.typeKind === 'Query'
    || schema.typeKind === 'Mutation'
    || schema.typeKind === 'Subscription') {
        // * Query, Mutation, Subscription Type
        // * View => FieldName(ArgName: ArgType) : FieldName
        // TODO: 템플릿화
        content = (
          <div>
            <h2>{schema.typeName}</h2>
            <ul>
              {/* Each Field */}
              {schema.fields.map(field => {
                const {details, plainType} = field.fieldType!
                return (
                  <li key={field.fieldName}>
                    {field.fieldName}({
                      // Each Args
                      field.args && field.args.map((arg, idx, arr) => {
                        const end = (idx + 1 < arr.length && ', ')
                        const plainType = arg.fieldType!.plainType
                        const details = arg.fieldType!.details
                        return <span key={arg.fieldName}>{arg.fieldName} : {details.front}<Link to={`${url}/${plainType}`}>{plainType}</Link>{details.back}{end}</span>
                      })
                    }) : {details.front}<Link to={`${url}/${plainType}`}>{plainType}</Link>{details.back}
                  </li>
                )
              })}
            </ul>
          </div>
          )
      }
      else if(schema.typeKind === 'Type') {
        content = (
          <div>
            <h2>{schema.typeName} : {schema.typeKind}</h2>
            <ul>
              {schema.fields.map(field => {
                const { plainType, details } = field.fieldType!
                return (
                  <li key={field.fieldName}>
                    {field.fieldName} : {details.front}<Link to={`${url}/${plainType}`}>{plainType}</Link>{details.back}
                  </li>
                )
              })}
            </ul>
          </div>
        )
    }
    else if(schema.typeKind === 'Enum'){
      content = (
        <div>
          <h2>{schema.typeName} : {schema.typeKind}</h2>
          <ul>
            {schema.fields.map(enumValue => {return <li key={enumValue.fieldName}>{enumValue.fieldName}</li>})}
          </ul>
        </div>
      )
    }
    else if(schema.typeKind ==='Union'){
      content = (
        <div>
          <h2>{schema.typeName} : {schema.typeKind}</h2>
          <ul>
            {schema.fields.map(possibleType => {
              const {plainType, details} = possibleType.fieldType!
              return <li key={possibleType.fieldName}>{details.front}<Link to={`${url}/${plainType}`}>{plainType}</Link>{details.back}</li>})}
          </ul>
        </div>
      )
    }
    else if(schema.typeKind === 'Input'){
      content = (
        <div>
          <h2>{schema.typeName} : {schema.typeKind}</h2>
          <ul>
            {schema.fields.map(inputField => {
              const { plainType, details } = inputField.fieldType!
              return <span key={inputField.fieldName}>{inputField.fieldName} : {details.front}<Link to={`${url}/${plainType}`}>{plainType}</Link>{details.back}</span>})}
          </ul>
        </div>
      )
    }
    else {
      return (
        <div>
          <h2>{schema.typeName} : {schema.typeKind}</h2>
        </div>
      )
    }
    return (
      <div>
        {content}
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