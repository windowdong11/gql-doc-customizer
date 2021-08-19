import { getIntrospectionQuery, IntrospectionEnumType, IntrospectionInputObjectType, IntrospectionInputType, IntrospectionInputTypeRef, IntrospectionInterfaceType, IntrospectionListTypeRef, IntrospectionNamedTypeRef, IntrospectionNonNullTypeRef, IntrospectionObjectType, IntrospectionOutputType, IntrospectionOutputTypeRef, IntrospectionQuery, IntrospectionScalarType, IntrospectionSchema, IntrospectionType, IntrospectionTypeRef, IntrospectionUnionType } from 'graphql';
import React, { useState } from 'react';
import { BrowserRouter, Link, Route, Switch, useParams, useRouteMatch } from 'react-router-dom';

function App() {
  const [endpoint, setEndpoint] = useState('http://localhost:4000')
  const [schema, setSchema] = useState<IntrospectionSchema>()
  if (schema) {
    console.log(schema)
  }
  const getSchema = () => {
    fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({ query: getIntrospectionQuery() }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => {
      return res.json()
    }).then((json: { data: IntrospectionQuery }) => {
      setSchema(json.data.__schema)
    })
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
          <Schema schema={schema} />
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
interface GetIntrospectionTypeResult {
  plainType: string,
  details: {
    front: string,
    back: string
  }
}
function getIntrospectionType(type: IntrospectionTypeRef): GetIntrospectionTypeResult {
  if (isIntrospectionNonNullTypeRef_Type(type)) {
    const { plainType, details: { front, back } } = getIntrospectionType(type.ofType)
    return {
      plainType,
      details: {
        front,
        back: '!' + back
      }
    }
  }
  else if (isIntrospectionListTypeRef(type)) {
    const { plainType, details: { front, back } } = getIntrospectionType(type.ofType)
    return {
      plainType,
      details: {
        front: front + '[',
        back: ']' + back
      }
    }
  }
  else { // Named Type
    return {
      plainType: type.name,
      details: {
        front: '',
        back: ''
      }
    }
  }
}
// * SchemaPage
interface SchemaProps {
  schema: IntrospectionSchema
}
function Schema(props: SchemaProps) {
  const { url } = useRouteMatch()
  console.log(url)
  const { type } = useParams<{ type: string }>()
  const schema = props.schema.types.find(obj => obj.name === type)
  if (schema) {
    let content : JSX.Element
    if (isIntrospectionObjectType(schema) || isIntrospectionInterfaceType(schema)) {
      if (type === props.schema.queryType.name
        || (props.schema.mutationType && type === props.schema.mutationType.name)
        || (props.schema.subscriptionType && type === props.schema.subscriptionType.name)) {
        // * Query, Mutation, Subscription Type
        // * View => FieldName(ArgName: ArgType) : FieldName
        // TODO: 템플릿화
        content = (
          <div>
            <h2>{schema.name}</h2>
            <ul>
              {/* Each Field */}
              {schema.fields.map(field => {
                const { plainType, details } = getIntrospectionType(field.type)
                return (
                  <li key={field.name}>
                    {field.name}({
                      // Each Args
                      field.args.map(arg => {
                        const { plainType, details } = getIntrospectionType(arg.type)
                        return <span key={arg.name}>{arg.name} : {details.front}<Link to={`${url}/${plainType}`}>{plainType}</Link>{details.back}</span>
                      })
                    }) : {details.front}<Link to={`${url}/${plainType}`}>{plainType}</Link>{details.back}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      }
      else {
        content = (
          <div>
            <h2>{schema.name} : {schema.kind}</h2>
            <ul>
              {schema.fields.map(field => {
                const { plainType, details } = getIntrospectionType(field.type)
                return (
                  <li key={field.name}>
                    {field.name} : {details.front}<Link to={`${url}/${plainType}`}>{plainType}</Link>{details.back}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      }
    }
    else if(isIntrospectionEnumType(schema)){
      content = (
        <div>
          <h2>{schema.name} : {schema.kind}</h2>
          <ul>
            {schema.enumValues.map(enumValue => {return <li key={enumValue.name}>{enumValue.name}</li>})}
          </ul>
        </div>
      )
    }
    else if(isIntrospectionUnionType(schema)){
      content = (
        <div>
          <h2>{schema.name} : {schema.kind}</h2>
          <ul>
            {schema.possibleTypes.map(possibleType => {
              const {plainType, details} = getIntrospectionType(possibleType)
              return <li key={possibleType.name}>{details.front}<Link to={`${url}/${plainType}`}>{plainType}</Link>{details.back}</li>})}
          </ul>
        </div>
      )
    }
    else if(isIntrospectionInputObjectType(schema)){
      content = (
        <div>
          <h2>{schema.name} : {schema.kind}</h2>
          <ul>
            {schema.inputFields.map(inputField => {
              const { plainType, details } = getIntrospectionType(inputField.type)
              return <span key={inputField.name}>{inputField.name} : {details.front}<Link to={`${url}/${plainType}`}>{plainType}</Link>{details.back}</span>})}
          </ul>
        </div>
      )
    }
    else {
      return (
        <div>
          <h2>{schema.name} : {schema.kind}</h2>
        </div>
      )
    }
    return (
      <div>
        {content}
        <Switch>
          <Route path={`${url}/:type`}>
            <Schema schema={props.schema}></Schema>
          </Route>
        </Switch>
      </div>
    )
  }
  return <div>Schema [{type}] not found.</div>
}

// * Type Guards : For Types

function isIntrospectionObjectType(obj: IntrospectionType): obj is IntrospectionObjectType { return obj.kind === 'OBJECT' }
function isIntrospectionInterfaceType(obj: IntrospectionType): obj is IntrospectionInterfaceType { return obj.kind === 'INTERFACE' }
function isIntrospectionScalarType(obj: IntrospectionType): obj is IntrospectionScalarType { return obj.kind === 'SCALAR' }
function isIntrospectionUnionType(obj: IntrospectionType): obj is IntrospectionUnionType { return obj.kind === 'UNION' }
function isIntrospectionEnumType(obj: IntrospectionType): obj is IntrospectionEnumType { return obj.kind === 'ENUM' }
function isIntrospectionInputObjectType(obj: IntrospectionType): obj is IntrospectionInputObjectType { return obj.kind === 'INPUT_OBJECT' }


// * Type Guards : For References

function isIntrospectionNamedTypeRef_Type(obj: IntrospectionTypeRef)
  : obj is IntrospectionNamedTypeRef {
  return !(isIntrospectionListTypeRef(obj) || isIntrospectionNonNullTypeRef_Type(obj))
}

function isIntrospectionNonNullTypeRef_Type(obj: IntrospectionTypeRef)
  : obj is IntrospectionNonNullTypeRef<IntrospectionNamedTypeRef | IntrospectionListTypeRef<any>> {
  return obj.kind === 'NON_NULL'
}

function isIntrospectionNamedTypeRef_InputType(obj: IntrospectionInputTypeRef)
  : obj is IntrospectionNamedTypeRef<IntrospectionInputType> {
  return !(isIntrospectionListTypeRef(obj) || isIntrospectionNonNullTypeRef_InputType(obj))
}

function isIntrospectionNonNullTypeRef_InputType(obj: IntrospectionInputTypeRef)
  : obj is IntrospectionNonNullTypeRef<IntrospectionNamedTypeRef<IntrospectionInputType> | IntrospectionListTypeRef<any>> {
  return obj.kind === 'NON_NULL'
}

function isIntrospectionNamedTypeRef_OutputType(obj: IntrospectionOutputTypeRef)
  : obj is IntrospectionNamedTypeRef<IntrospectionOutputType> {
  return !(isIntrospectionListTypeRef(obj) || isIntrospectionNonNullTypeRef_OutputType(obj))
}

function isIntrospectionNonNullTypeRef_OutputType(obj: IntrospectionOutputTypeRef)
  : obj is IntrospectionNonNullTypeRef<IntrospectionNamedTypeRef<IntrospectionOutputType> | IntrospectionListTypeRef<any>> {
  return obj.kind === 'NON_NULL'
}

function isIntrospectionListTypeRef(obj: IntrospectionInputTypeRef | IntrospectionOutputTypeRef | IntrospectionTypeRef)
  : obj is IntrospectionListTypeRef<any> {
  return obj.kind === 'LIST'
}