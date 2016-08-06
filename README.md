#mahalo-loader
This module contains a loader for webpack. It is used to load templates for
ths Mahalo framework.

## Installation
You should install this package as a development dependency like so:

```sh
npm install --save-dev mahalo-loader
```

##Usage
Configure webpack to use the preset for the desired files. Typically you will
use the .mhml extension for your files. This will give you the best IDE support.
But everything else works fine as well.

In your webpack config object you should have something similar to this:

```javascript
    module: {
        loaders: [
            {
                test: /\.mhml$/,
                loader: 'mahalo'
            }
        ]
    }
```