# gql-doc-customizer

- [gql-doc-customizer](#gql-doc-customizer)
  - [스키마 분석기 (schema analyser)](#스키마-분석기-schema-analyser)
  - [Type 표시 형식](#type-표시-형식)
  - [docker](#docker)
  - [Todo](#todo)
    - [바로 할 것](#바로-할-것)
    - [곧 추가할 것](#곧-추가할-것)

## 스키마 분석기 (schema analyser)

`analyzeSchemaByType(props: AnalyzeSchemaByTypeProps) : AnalyzeSchemaResult | undefined`  
`props`로 주어진 `schema`에서 `curType`를 찾아 분석하여 `AnalyzeSchemaResult`형태로 결과를 반환합니다.  
`undefined` : `curType`를 찾지 못함  

> AnalyzeSchemaResult가 아직 타입별로 interface가 나뉘지 않았습니다.  
> 바로 다음 업데이트에 `Type`, `Enum`, `Union`, `Input`, `Schema`별로 interface를 나누고 Type Guard 또한 제공할 예정  

## Type 표시 형식

Title  
| Type                          | Content                   |
| :---------------------------- | :------------------------ |
| Query, Mutation, Subscription | `<Query \| Mutation \| Subscription>` |
| Enum, Union, Input            | `<typeName> : <typeKind>` |
| Scalar                        | `<typeName>`              |

Content  
| Type              | Content                                               |
| ----------------- | ----------------------------------------------------- |
| Object, Interface | `<fieldName>(<argName>:<argType>, ...) : <fieldName>` |
| Enum              | `<enumValue>`                                         |
| Union             | `<unionType>`                                         |
| Input             | `<inputValue>`                                        |
| Scalar            | `none`                                                |

## docker

[Docker Hub](https://hub.docker.com/repository/docker/windowdong11/gql-doc-customizer)

## Todo

### 바로 할 것

1. AnalyzeSchemaResult 타입별 분리.  
   (`Type`, `Enum`, `Union`, `Input`, `Schema`)별 분리  

### 곧 추가할 것

1. 템플릿을 이용하여 정적페이지 생성  
   (방법 찾는중)
2. 타입의 필요한 부분만 분석해주는 기능들  
   - Types  
     1. getTypeName(type)  
     2. getTypeFields(type)  
   - Field  
     1. getFieldName(field)  
     2. getFieldType(field)  
     3. getFieldArgs(field)  
   - Argument  
     1. getArgName(arg)  
     2. getArgType(arg)  
