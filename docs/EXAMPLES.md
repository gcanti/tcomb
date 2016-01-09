# Generate the documentation

Automatically generate the documentation of your domain model is pretty easy when you can inspect your types:

```js
// returns a markdown describing the argument type
function doc(type, indent = 0) {
  const { name, kind } = type.meta;
  switch (type.meta.kind) {
    case 'irreducible' :
    case 'enums' :
      return name;
    case 'subtype' :
      return name + ' -> ' + doc(type.meta.type, indent + 1);
    case 'maybe' :
      return '?' + doc(type.meta.type, indent + 1);
    case 'struct' :
      return (indent ? '' : name) + '\n' +
        _.map(type.meta.props, (type, k) => (_.repeat('  ', indent)) + '- ' + k + ': ' + doc(type, indent + 1)).join('\n')
  }
}

console.log(doc(User))
```

Output

```js
User
- id: String
- email: Email -> String
- role: Role
- anagraphics: Anagraphics ->
    - birthDate: ?Date
    - name: ?String
    - surname: ?String
```