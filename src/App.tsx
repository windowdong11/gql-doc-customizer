import { getIntrospectionQuery, IntrospectionEnumType, IntrospectionInputObjectType, IntrospectionInputType, IntrospectionInputTypeRef, IntrospectionInterfaceType, IntrospectionListTypeRef, IntrospectionNamedTypeRef, IntrospectionNonNullTypeRef, IntrospectionObjectType, IntrospectionOutputType, IntrospectionOutputTypeRef, IntrospectionQuery, IntrospectionScalarType, IntrospectionSchema, IntrospectionType, IntrospectionTypeRef, IntrospectionUnionType, TypeKind } from 'graphql';
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

// * 템플릿 사용할 수 있도록 변경하는 부분
interface AnalyzeSchemaField {
  fieldName: string
  fieldType?: GetIntrospectionTypeResult
  description?: string
  isDeprecated: boolean // ! Only 'fields' and 'enums' can be deprecated
  deprecatedReason?: string
  defaultValue?: string
}
interface AnalyzeSchemaResult {
  typeName : string
  typeKind : 'Query' | 'Mutation' | 'Subscription' | 'Type' | 'Enum' | 'Union' | 'Input' | 'Scalar'
  fields : (AnalyzeSchemaField & {args?: AnalyzeSchemaField[]})[]
}

interface AnalyzeSchemaByTypeProps {
  schema: IntrospectionSchema,
  curType: string
}

// * schema에서 curType를 찾아서 분석한 결과를 돌려줌
function analyzeSchemaByType(props: AnalyzeSchemaByTypeProps) : AnalyzeSchemaResult | undefined {
  const type = props.curType
  const schema = props.schema.types.find(obj => obj.name === type)
  if (schema) {
    if (isIntrospectionObjectType(schema) || isIntrospectionInterfaceType(schema)) {
      let typeName : AnalyzeSchemaResult['typeName']
      let typeKind : AnalyzeSchemaResult['typeKind']
      if(type === props.schema.queryType.name){
        typeName = typeKind = 'Query'
      }
      else if(props.schema.mutationType && type === props.schema.mutationType.name){
        typeName = typeKind = 'Mutation'
      }
      else if(props.schema.subscriptionType && type === props.schema.subscriptionType.name){
        typeName = typeKind = 'Subscription'
      }
      else {
        typeName = schema.name
        typeKind = 'Type'
      }
      // * Query, Mutation, Subscription, Type(Object, Interface)
      // * View => FieldName(ArgName: ArgType) : FieldName
      const fields: AnalyzeSchemaResult['fields'] = schema.fields.map(field => {
        return {
          fieldName: field.name,
          fieldType: getIntrospectionType(field.type),
          description: field.description,
          isDeprecated: field.isDeprecated,
          deprecatedReason: field.deprecationReason,
          args: field.args.map(arg => {
            return {
              fieldName: arg.name,
              fieldType: getIntrospectionType(arg.type),
              description: arg.description,
              isDeprecated: arg.isDeprecated,
              deprecatedReason: arg.deprecationReason,
              defaultValue: arg.defaultValue
            } as AnalyzeSchemaField
          })
        } as (AnalyzeSchemaField & { args: AnalyzeSchemaField[] })
      }) as AnalyzeSchemaResult['fields']

      return {
        typeName,
        typeKind,
        fields,
      }
    }
    else if(isIntrospectionEnumType(schema)){
      return {
        typeName: schema.name,
        typeKind: 'Enum',
        fields: schema.enumValues.map(enumValue => {
          return {
          fieldName: enumValue.name,
          isDeprecated: enumValue.isDeprecated,
          deprecatedReason: enumValue.deprecationReason,
          description: enumValue.description
        } as AnalyzeSchemaField})
      }
    }
    else if(isIntrospectionUnionType(schema)){
      return {
        typeName: schema.name,
        typeKind: 'Enum',
        fields: schema.possibleTypes.map(possibleType => {
          return {
          fieldName: possibleType.name,
          fieldType: getIntrospectionType(possibleType),
          isDeprecated: false,
        } as AnalyzeSchemaField})
      }
    }
    else if(isIntrospectionInputObjectType(schema)){
      return {
        typeName: schema.name,
        typeKind: 'Enum',
        fields: schema.inputFields.map(inputField => {
          return {
          fieldName: inputField.name,
          isDeprecated: inputField.isDeprecated,
          deprecatedReason: inputField.deprecationReason,
          description: inputField.description,
          defaultValue: inputField.defaultValue
        } as AnalyzeSchemaField})
      }
    }
    else {
      return {
        typeName: schema.name,
        typeKind: 'Scalar',
        fields: []
      }
    }
  }
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