# gql-doc-customizer

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