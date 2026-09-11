# How to Start a New Feature Module

This document outlines the process for creating a new feature module following the project's **feature-sliced architecture** and **SOLID principles**. Each new feature module should reside within the `src/modules` directory and adhere to the following structure:

## 🚀 Steps to Create a New Feature Module

### 1. **Create the Module Directory**

```bash
mkdir src/modules/your-feature-name
```

### 2. **Create Subdirectories**

```bash
cd src/modules/your-feature-name
mkdir components hooks pages constants services utils
```

### 3. **Create Core Files**

#### `types.ts` - Type Definitions

```typescript
// src/modules/your-feature-name/types.ts
// You can use global types from @/types/global.d.ts such as:
// - IDDl
// - IStatus

export interface YourFeatureEntity {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateYourFeatureRequest {
  name: string
  description?: string
}

export interface UpdateYourFeatureRequest extends Partial<CreateYourFeatureRequest> {
  id: string
}
```

#### `schema.ts` - Validation Schemas

```typescript
// src/modules/your-feature-name/schema.ts
// You can use shared schema utilities from @/lib/schema such as:
// - objectTransform
// - numberTransform
// - filesTransform
// Use @/lib/password-policy for fields that create or replace passwords.

import { object, string, date, mixed } from 'yup'
import { numberTransform } from '@/lib/schema'

export const CreateYourFeatureSchema = object().shape({
  name: string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  description: string().optional(),
  status: string().required('Status is required'),
  image: mixed().optional(),
})

export const UpdateYourFeatureSchema = CreateYourFeatureSchema.shape({
  id: string().required('ID is required'),
})
```

#### `constants/index.ts` - Module Constants

```typescript
// src/modules/your-feature-name/constants/index.ts
// You can use this file to add default values, status constants, and other module-specific constants
```

### 4. **Create Components**

#### `components/YourFeatureCard.tsx` - Pure Presentational Component

```typescript
// src/modules/your-feature-name/components/YourFeatureCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { YourFeatureEntity } from '../types'

interface YourFeatureCardProps {
  item: YourFeatureEntity
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export const YourFeatureCard = ({ item, onEdit, onDelete, isLoading = false }: YourFeatureCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {item.name}
          <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
            {item.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            onClick={() => onEdit(item.id)}
            disabled={isLoading}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(item.id)}
            disabled={isLoading}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### `hooks/useYourFeatureList.ts` - Container

```typescript
// src/modules/your-feature-name/hooks/useYourFeatureList.ts
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useYourFeatureWithQuery } from './useYourFeatureWithQuery'
import { YourFeatureEntity } from '../types'

export const useYourFeatureList = () => {
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleEdit = (id: string) => {
    navigate(`/your-feature/${id}/edit`)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteItem(deleteId)
        setDeleteId(null)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  const cancelDelete = () => {
    setDeleteId(null)
  }

  return {
    data,
    isLoading,
    deleteId,
    handleEdit,
    handleDelete,
    confirmDelete,
    cancelDelete,
  }
}
```

### 5. **Create Pages**

#### `pages/ListYourFeaturePage.tsx` - Page Using Container and Presentational Component

```typescript
// src/modules/your-feature-name/pages/ListYourFeaturePage.tsx
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { YourFeatureCard } from '../components/YourFeatureCard'
import { Loading } from '@/components/core/Loading'
import { DeleteAlert } from '@/components/shared/DeleteAlert'
import { useYourFeatureList } from '../hooks/useYourFeatureList'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

const ListYourFeaturePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Use the custom hook (container) for business logic
  const {
    data,
    isLoading,
    deleteId,
    handleEdit,
    handleDelete,
    confirmDelete,
    cancelDelete,
  } = useYourFeatureList()

  const handleAddNew = () => {
    navigate('/your-feature/add')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('your-feature.list.title')}
        description={t('your-feature.list.description')}
        actions={
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            {t('your-feature.add.button')}
          </Button>
        }
      />

      {isLoading ? (
        <Loading />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((item) => (
            <YourFeatureCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      <DeleteAlert
        isOpen={!!deleteId}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Feature"
        description="Are you sure you want to delete this feature? This action cannot be undone."
      />
    </div>
  )
}

export default ListYourFeaturePage
```

### 6. **Define Routes**

#### Update `src/routes/routes.ts`

```typescript
// Add to existing Routes object
export const Routes = {
  // ... existing routes
  yourFeature: {
    list: '/your-feature',
    add: '/your-feature/add',
    edit: '/your-feature/:id/edit',
    view: '/your-feature/:id',
  },
}
```

#### Create `src/routes/privateRoutes/yourFeatureRoutes.ts`

```typescript
import { RouteObject } from 'react-router'
import { Routes } from '../routes'
import { lazy } from 'react'

const YourFeatureRoutes: RouteObject[] = [
  {
    index: true,
    path: Routes.yourFeature.list,
    Component: lazy(() => import('@/modules/your-feature-name/pages/ListYourFeaturePage')),
  },
  {
    path: Routes.yourFeature.add,
    Component: lazy(() => import('@/modules/your-feature-name/pages/AddYourFeaturePage')),
  },
  {
    path: Routes.yourFeature.edit,
    Component: lazy(() => import('@/modules/your-feature-name/pages/EditYourFeaturePage')),
  },
  {
    path: Routes.yourFeature.view,
    Component: lazy(() => import('@/modules/your-feature-name/pages/ViewYourFeaturePage')),
  },
]

export { YourFeatureRoutes }
```

### 7. **Add Translations**

#### Update `src/lang/en.json`

#### Update `src/lang/ar.json`

```

```
