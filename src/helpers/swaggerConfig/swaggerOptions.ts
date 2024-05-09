import swaggerJsdoc from "swagger-jsdoc";
import expressListEndpoints from "express-list-endpoints";
import path from "path";
import yaml from "js-yaml";
import fs from "fs";

// Define the interface for the Swagger definition
interface SwaggerDefinitionInterface {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
    };
    servers: {
        url: string;
        description: string;
    }[];
    paths: any; // Define paths dynamically
    [key: string]: any; // Allow additional properties
}

// Define the required Swagger properties
const swaggerDefinition: SwaggerDefinitionInterface = {
    openapi: "3.0.0",
    info: {
        title: "Shopper API",
        version: "1.0.0",
        description: "This is a simple API for an online shop",
    },
    servers: [
        {
            url: "http://localhost:5000",
            description: "Development server",
        },
    ],
    paths: {}, // Initialize paths as an empty object
};

// Get routes dynamically
const routes = [
    "../../routes/user.routes",
    "../../routes/category.routes",
    "../../routes/order.routes",
    "../../routes/product.routes",
    "../../routes/upload.routes",
    "../../routes/userLocation.routes",
];

// Dynamically load routes and merge with Swagger definition
routes.forEach((routePath) => {
    const routesModule = require(routePath).default;
    const endpoints = expressListEndpoints(routesModule);

    endpoints.forEach((endpoint: any) => {
        const method = endpoint.methods[0].toLowerCase();
        const url = endpoint.path;

        if (!swaggerDefinition.paths[url]) {
            swaggerDefinition.paths[url] = {};
        }

        // Add the route title
        swaggerDefinition.paths[url][method] = {
            summary: endpoint.summary || "", // Route title or summary
            description: endpoint.description || "", // Route description
            parameters: endpoint.parameters || [], // Request parameters
            // Add other properties as needed
        };
    });
});

// Initialize swaggerConfig-jsdoc
const swaggerOptions = {
    swaggerDefinition: swaggerDefinition,
    apis: [] as string[], // No need to specify APIs here
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Save the generated Swagger documentation to swaggerConfig.yaml
const swaggerFilePath = path.join(__dirname, "swaggerConfig.yaml");
fs.writeFile(swaggerFilePath, yaml.dump(swaggerSpec), (err) => {
    if (err) {
        console.error("Error writing Swagger documentation to file:", err);
    } else {
        console.log("Swagger documentation has been saved to swaggerConfig.yaml");
    }
});

export default swaggerSpec;


// import swaggerJsdoc from "swaggerConfig-jsdoc";
// import expressListEndpoints from "express-list-endpoints";
// import path from "path";
// import yaml from "js-yaml";
// import fs from "fs";
//
// // Define the interface for the Swagger definition
// interface SwaggerDefinitionInterface {
//     openapi: string;
//     info: {
//         title: string;
//         version: string;
//         description: string;
//     };
//     servers: {
//         url: string;
//         description: string;
//     }[];
//     paths: any; // Define paths dynamically
//
//     [key: string]: any; // Allow additional properties
// }
//
// // Define the required Swagger properties
// const swaggerDefinition: SwaggerDefinitionInterface = {
//     openapi: "3.0.0",
//     info: {
//         title: "Shopper API",
//         version: "1.0.0",
//         description: "This is a simple API for an online shop",
//     },
//     servers: [
//         {
//             url: "http://localhost:5000",
//             description: "Development server",
//         },
//     ],
//     paths: {}, // Initialize paths as an empty object
// };
//
// // Get routes dynamically
// const routes = [
//     "../../routes/user.routes",
//     "../../routes/category.routes",
//     "../../routes/order.routes",
//     "../../routes/product.routes",
//     "../../routes/upload.routes",
//     "../../routes/userLocation.routes",
// ];
//
// // Dynamically load routes and merge with Swagger definition
// routes.forEach((routePath) => {
//     const routesModule = require(routePath).default;
//     const endpoints = expressListEndpoints(routesModule);
//     endpoints.forEach((endpoint: any) => {
//         const method = endpoint.methods[0].toLowerCase();
//         const url = endpoint.path;
//         if (!swaggerDefinition.paths[url]) {
//             swaggerDefinition.paths[url] = {};
//         }
//         // Add a title and parameters to each route
//         swaggerDefinition.paths[url][method] = {
//             summary: `Title for ${url}`, // Replace with actual title
//             description: `Description for ${url}`, // Replace with actual description
//             parameters: [
//                 // Define parameters for the endpoint
//                 {
//                     name: "param1",
//                     in: "query", // could be "path", "query", "header", "cookie"
//                     required: true,
//                     description: "A description of param1",
//                     schema: {
//                         type: "string", // could be "string", "number", "boolean", "array", etc.
//                     },
//                 },
//                 // Add more parameters as needed
//             ],
//             responses: {
//                 // Define responses for the endpoint
//                 "200": {
//                     description: "Successful response",
//                     // Define the response schema, headers, examples, etc.
//                 },
//                 // Add more responses as needed
//             },
//             // If the endpoint has a request body, define it here
//             requestBody: {
//                 // Define the request body if applicable
//             },
//             // Add more properties as needed
//         };
//     });
// });
//
// // // Dynamically load routes and merge with Swagger definition
// // routes.forEach((routePath) => {
// //     const routesModule = require(routePath).default;
// //     const endpoints = expressListEndpoints(routesModule);
// //     endpoints.forEach((endpoint: any) => {
// //         const method = endpoint.methods[0].toLowerCase();
// //         const url = endpoint.path;
// //         if (!swaggerDefinition.paths[url]) {
// //             swaggerDefinition.paths[url] = {};
// //         }
// //         swaggerDefinition.paths[url][method] = {
// //             summary: "", // Add summary if needed
// //             description: "", // Add description if needed
// //         };
// //     });
// // });
//
// // Initialize swaggerConfig-jsdoc
// const swaggerOptions = {
//     swaggerDefinition: swaggerDefinition,
//     apis: [] as string[], // No need to specify APIs here
// };
// const swaggerSpec = swaggerJsdoc(swaggerOptions);
//
// // Save the generated Swagger documentation to swaggerConfig.yaml
// const swaggerFilePath = path.join(__dirname, "swaggerConfig.yaml");
// fs.writeFile(swaggerFilePath, yaml.dump(swaggerSpec), (err) => {
//     if (err) {
//         console.error("Error writing Swagger documentation to file:", err);
//     } else {
//         console.log("Swagger documentation has been saved to swaggerConfig.yaml");
//     }
// });
//
// export default swaggerSpec;