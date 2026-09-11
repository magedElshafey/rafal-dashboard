# Project Features Overview

This document outlines the key features and architectural patterns implemented in this base React project.

## 1. Feature-Sliced Design (FSD) Architecture

**Description:** The project adopts a Feature-Sliced Design (FSD) architecture, particularly evident in the `src/modules` directory. Each module represents a distinct feature or domain within the application, promoting high cohesion and low coupling.

**Structure within each module:**

- `components/`: Reusable UI components specific to the module
- `containers/`: Components responsible for data fetching and logic
- `hooks/`: Custom React hooks for encapsulating reusable stateful logic
- `pages/`: Entry points for module-specific routes/views
- `schema.ts`: Data validation schemas (using Zod, Yup)
- `types.ts`: TypeScript type definitions specific to the module
- `constants/`: Module-specific constant values.

**Implemented Modules:**

- **Admins Module**: User management functionality with CRUD operations
- **Dashboard Module**: Analytics and data visualization with charts
- **Errors Module**: Comprehensive error handling and error pages

**References:**

- [src/modules/](src/modules/) - Feature modules directory
- [docs/how_to_start_feature.md](docs/how_to_start_feature.md) - Feature development guide

## 2. Centralized State Management (Zustand)

**Description:** The project utilizes Zustand for efficient and scalable state management. The `src/store` directory centralizes global application state.

**Key Stores:**

- [src/store/auth.ts](src/store/auth.ts) - Authentication state management
- [src/store/permission.ts](src/store/permission.ts) - User permissions management
- [src/store/query.ts](src/store/query.ts) - API query state management
- [src/store/settings.ts](src/store/settings.ts) - Application settings

**References:**

- [src/store/](src/store/) - State management directory

## 3. API Integration and Error Handling

**Description:** Structured approach to API integration using Axios with centralized error handling for consistent backend communication.

**Key Files:**

- [src/config/axios.ts](src/config/axios.ts) - Axios configuration
- [src/routes/apis.ts](src/routes/apis.ts) - API endpoint definitions
- [src/utils/errorHandler.ts](src/utils/errorHandler.ts) - Error handling utilities
- [src/hooks/useError.tsx](src/hooks/useError.tsx) - Error handling hook

**References:**

- [src/config/](src/config/) - Configuration files
- [src/routes/](src/routes/) - Routing configuration
- [src/utils/](src/utils/) - Utility functions
- [src/hooks/](src/hooks/) - Custom hooks

## 4. Routing System and Navigation

**Description:** Comprehensive routing system using React Router v6 with organized route structures for different application areas.

**Key Files:**

- [src/routes/routes.ts](src/routes/routes.ts) - Main routing configuration
- [src/routes/index.ts](src/routes/index.ts) - Route initialization
- [src/routes/privateRoutes/](src/routes/privateRoutes/) - Protected routes
- [src/routes/publicRoutes/](src/routes/publicRoutes/) - Public routes
- [src/routes/authRoutes/](src/routes/authRoutes/) - Authentication routes
- [src/routes/appRoutes/](src/routes/appRoutes/) - App-specific routes

**References:**

- [src/routes/](src/routes/) - Routing system directory

## 5. Build System and Development Tools

**Description:** Modern build system using Vite with TypeScript support, providing fast development experience and optimized production builds.

**Key Configuration Files:**

- [vite.config.ts](vite.config.ts) - Vite build configuration
- [tsconfig.json](tsconfig.json) - TypeScript configuration
- [eslint.config.js](eslint.config.js) - ESLint configuration
- [.prettierrc](.prettierrc) - Prettier configuration
- [components.json](components.json) - UI components configuration

**References:**

- [package.json](package.json) - Project dependencies and scripts

## 6. Testing and Quality Assurance

**Description:** Comprehensive testing setup with Jest and various quality assurance tools to ensure code reliability and maintainability.

**Key Features:**

- **Jest Testing Framework**: Unit and integration testing capabilities
- **TypeScript Type Checking**: Strict type checking with `tsc --noEmit`
- **ESLint Configuration**: Comprehensive linting rules for React, TypeScript, and accessibility
- **Prettier Integration**: Automated code formatting
- **Lint-staged**: Pre-commit hooks for code quality enforcement

**Scripts:**

- `yarn test`: Run Jest tests
- `yarn test:watch`: Run tests in watch mode
- `yarn typecheck`: TypeScript type checking
- `yarn lint`: ESLint code analysis
- `yarn lint:fix`: Auto-fix linting issues
- `yarn format`: Prettier code formatting

**References:**

- [package.json](package.json) - Testing scripts and dependencies

## 7. Code Quality and Automation

**Description:** Emphasis on code quality and automation through pre-commit hooks, commit linting, and GitHub Actions pipelines.

**Key Features:**

- **Commit Linting**: Enforces conventional commit messages
- **Husky Hooks**: Git hooks for automated tasks
- **GitHub Actions**: Automated CI/CD workflows including linting, deployment, and release management

**References:**

- [commitlint.config.js](commitlint.config.js) - Commit linting configuration
- [.husky/](.husky/) - Git hooks directory
- [.github/workflows/](.github/workflows/) - GitHub Actions workflows
- [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/#summary) - Commit message standards

## 8. Internationalization (i18n)

**Description:** Multi-language support with translations managed in JSON files, allowing easy expansion to new languages.

**Key Files:**

- [src/config/i18.ts](src/config/i18.ts) - i18n configuration
- [src/lang/ar.json](src/lang/ar.json) - Arabic translations
- [src/lang/en.json](src/lang/en.json) - English translations

**References:**

- [src/lang/](src/lang/) - Language files directory

## 9. Reusable UI Components

**Description:** Well-organized component library with consistent design patterns and reusable elements.

**Component Categories:**

- **Core Components**: Fundamental UI elements (Each, FormWrapper, Loading, etc.)
- **Form Components**: Comprehensive form elements with validation support
- **Layout Components**: Page structure and navigation components
- **UI Components**: General purpose UI elements (buttons, inputs, dialogs, etc.)
- **Filter Components**: Data filtering and search components
- **Table Components**: Advanced table functionality with pagination and actions
- **Theme Components**: Theming and styling components

**References:**

- [src/components/](src/components/) - UI components directory

## 10. Utility Functions and Custom Hooks

**Description:** Comprehensive set of utility functions and custom React hooks for common logic and code reusability.

**Key Utilities:**

- **Form Handling**: Form data processing and validation utilities
- **HTTP Utilities**: API communication and error handling
- **Data Processing**: Date formatting, object manipulation, and data handlers
- **UI Utilities**: Class name utilities, clipboard operations, and file validation

**Custom Hooks:**

- **useFetch**: Data fetching with error handling
- **useError**: Centralized error management
- **use-mobile**: Mobile viewport detection
- **useResize**: Window resize detection
- **useRtl**: RTL language support
- **useInterSection**: Intersection Observer functionality

**References:**

- [src/utils/](src/utils/) - Utility functions directory
- [src/hooks/](src/hooks/) - Custom hooks directory
- [src/lib/](src/lib/) - Core library utilities

## 11. Type System and TypeScript Configuration

**Description:** Robust TypeScript setup with strict type checking, path aliases, and comprehensive type definitions.

**Key Files:**

- [src/types/global.d.ts](src/types/global.d.ts) - Global type definitions
- [src/vite-env.d.ts](src/vite-env.d.ts) - Vite environment types

**References:**

- [src/types/](src/types/) - Type definitions directory

## 12. Asset Management

**Description:** Organized asset management for images, icons, and other static resources.

**Key Files:**

- [src/assets/react.svg](src/assets/react.svg) - React logo
- [src/assets/arabic.svg](src/assets/arabic.svg) - Arabic language icon
- [src/assets/english.svg](src/assets/english.svg) - English language icon

**References:**

- [src/assets/](src/assets/) - Assets directory

## 13. Form Management and Validation

**Description:** Comprehensive form handling with React Hook Form, Zod validation, and custom form components.

**Key Features:**

- **React Hook Form**: Efficient form state management
- **Zod Validation**: Type-safe schema validation
- **Form Components**: Reusable form elements with consistent styling
- **Form Data Handling**: Utilities for form data processing and submission

**References:**

- [src/components/form/](src/components/form/) - Form components directory
- [src/lib/schema.ts](src/lib/schema.ts) - Validation schemas
- [src/lib/formData.ts](src/lib/formData.ts) - Form data utilities

## 14. Data Visualization and Charts

**Description:** Data visualization capabilities with Recharts library for creating interactive charts and graphs.

**Key Components:**

- [src/modules/dashboard/components/AreaChart.tsx](src/modules/dashboard/components/AreaChart.tsx) - Area chart component
- [src/modules/dashboard/components/PieChart.tsx](src/modules/dashboard/components/PieChart.tsx) - Pie chart component
- [src/modules/dashboard/components/RadarChart.tsx](src/modules/dashboard/components/RadarChart.tsx) - Radar chart component

**References:**

- [src/modules/dashboard/components/](src/modules/dashboard/components/) - Dashboard components directory
