# Project Structure (src folder)

```
src/
├── main.tsx: Entry point of the React application.
├── App.css: Main application CSS file.
├── App.tsx: Main application component.
├── assets/: Contains static assets like images and icons.
├── config/: Configuration files for various services and settings.
├── hooks/: Custom React hooks for reusable logic.
├── types/: TypeScript type definitions.
│   └── global.d.ts: Global type declarations.
├── lang/: Language translation files (e.g., JSON files for different locales).
│   ├── axios.ts: Axios instance configuration for API requests.
│   ├── env.ts: Environment variable definitions.
│   └── i18.ts: Internationalization (i18n) configuration.
├── lib/: Utility functions and helper libraries.
│   ├── formData.ts: Utilities for form data manipulation.
│   ├── schema.ts: Validation schemas (e.g., Zod schemas).
│   └── utils.ts: General utility functions.
├── components/: Reusable UI components.
│   ├── core/: Core components used across the application.
│   ├── form/: Components related to form handling and input.
│   ├── layouts/: Defines the overall structure and layout of different app sections.
│   ├── shared/: Shared components used in various parts of the application.
│   ├── theme/: Theming related components and utilities.
│   └── ui/: UI components built using shadcn/ui.
├── modules/: Feature-specific modules or domains of the application, following a feature-sliced architecture. Each module should contain:
│   ├── components/: Module-specific reusable UI components.
│   ├── containers/: Module-specific custom hooks that manage state and logic.
│   ├── hooks/: Custom React hooks specific to the module.
│   ├── pages/: Entry points for module-specific pages.
│   └── constants/: Module-specific constant values.
│   ├── schema.ts: Validation schemas for the module's data.
│   ├── types.ts: TypeScript type definitions for the module.
├── routes/: Defines application routes and API endpoints.
│   ├── apis.ts: API endpoint definitions.
│   ├── index.ts: Route index file.
│   └── routes.ts: Main application route definitions.
├── store/: State management.
│   ├── auth.ts: Authentication state.
│   ├── permission.ts: User permissions state.
│   ├── queryContext/: Context for query-related functionalities.
│   └── settings.ts: Application settings state.

```
