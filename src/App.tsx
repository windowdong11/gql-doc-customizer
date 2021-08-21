import { IntrospectionSchema } from 'graphql';
import { useState } from 'react';
import { BrowserRouter, Link, Route } from 'react-router-dom';
import ResolverSelector from './components/ResolverSelector';
import TemplateSchema from './components/TemplateSchema';
import { getSchemaFromEndpoint } from './schemaInspector';

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