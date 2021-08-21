import { IntrospectionSchema, IntrospectionTypeRef, getIntrospectionQuery, IntrospectionQuery } from "graphql"
import { isIntrospectionNonNullTypeRef_Type, isIntrospectionListTypeRef, isIntrospectionObjectType, isIntrospectionInterfaceType, isIntrospectionEnumType, isIntrospectionUnionType, isIntrospectionInputObjectType } from "./TypeGuards"


export interface GetIntrospectionTypeResult {
    plainType: string,
    details: {
        front: string,
        back: string
    }
}
export function getIntrospectionType(type: IntrospectionTypeRef): GetIntrospectionTypeResult {
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

// * 템플릿 사용할 수 있도록 변경하는 부분
export interface AnalyzeSchemaField {
    fieldName: string
    fieldType?: GetIntrospectionTypeResult
    description?: string
    isDeprecated: boolean // ! Only 'fields' and 'enums' can be deprecated
    deprecatedReason?: string
    defaultValue?: string
}
export interface AnalyzeSchemaResult {
    typeName: string
    typeKind: 'Query' | 'Mutation' | 'Subscription' | 'Type' | 'Enum' | 'Union' | 'Input' | 'Scalar'
    fields: (AnalyzeSchemaField & { args?: AnalyzeSchemaField[] })[]
}

export interface AnalyzeSchemaByTypeProps {
    schema: IntrospectionSchema,
    curType: string
}

// * schema에서 curType를 찾아서 분석한 결과를 돌려줌
export function analyzeSchemaByType(props: AnalyzeSchemaByTypeProps): AnalyzeSchemaResult | undefined {
    const type = props.curType
    const schema = props.schema.types.find(obj => obj.name === type)
    if (schema) {
        if (isIntrospectionObjectType(schema) || isIntrospectionInterfaceType(schema)) {
            let typeName: AnalyzeSchemaResult['typeName']
            let typeKind: AnalyzeSchemaResult['typeKind']
            typeName = schema.name
            if (type === props.schema.queryType.name) {
                typeKind = 'Query'
            }
            else if (props.schema.mutationType && type === props.schema.mutationType.name) {
                typeKind = 'Mutation'
            }
            else if (props.schema.subscriptionType && type === props.schema.subscriptionType.name) {
                typeKind = 'Subscription'
            }
            else {
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
        else if (isIntrospectionEnumType(schema)) {
            return {
                typeName: schema.name,
                typeKind: 'Enum',
                fields: schema.enumValues.map(enumValue => {
                    return {
                        fieldName: enumValue.name,
                        isDeprecated: enumValue.isDeprecated,
                        deprecatedReason: enumValue.deprecationReason,
                        description: enumValue.description
                    } as AnalyzeSchemaField
                })
            }
        }
        else if (isIntrospectionUnionType(schema)) {
            return {
                typeName: schema.name,
                typeKind: 'Enum',
                fields: schema.possibleTypes.map(possibleType => {
                    return {
                        fieldName: possibleType.name,
                        fieldType: getIntrospectionType(possibleType),
                        isDeprecated: false,
                    } as AnalyzeSchemaField
                })
            }
        }
        else if (isIntrospectionInputObjectType(schema)) {
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
                    } as AnalyzeSchemaField
                })
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

export function getSchemaFromEndpoint(endpoint: string){
    return fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ query: getIntrospectionQuery() }),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => {
        return res.json()
    }).then((json: { data: IntrospectionQuery }) => {
        return json.data.__schema
    })
}

export function getQueryTypeName(schema: IntrospectionSchema){
    return schema.queryType.name
}
export function getMutationTypeName(schema: IntrospectionSchema){
    return schema.mutationType?.name
}
export function getSubscriptionTypeName(schema: IntrospectionSchema){
    return schema.subscriptionType?.name
}