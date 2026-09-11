# Table Component System

## Overview

The Table component system is a comprehensive, enterprise-grade solution for displaying tabular data with advanced features including server-side data fetching, pagination, sorting, and action handling. Built with React, TypeScript, ShadcnUI, and following SOLID principles, it provides a flexible and maintainable architecture for data presentation.

### Core Components

- **TableProvider**: Manages table state and data fetching
- **TableHeader**: Renders sortable column headers
- **TableBody**: Displays table rows with custom rendering
- **TablePagination**: Handles page navigation
- **TableAction**: Individual action buttons (Edit, Delete, View)
- **TableActionsDropdown**: Dropdown menu for multiple actions

## Installation & Setup

```bash
# The components are already available in your project
import QueryProvider from '@/store/queryContext/queryContext'
import { Table, TableRow, TableCell } from '@/components/ui/table'
import { TableHeader,TableProvider,TableBody,  TablePagination,  TableActionsDropdown,  TableAction, } from '@/components/ui/Table/index'
```

## Component API Reference

### TableProvider

The main provider component that manages table state and data fetching.

```tsx
interface TableProviderProps<T> {
  name?: string // Unique identifier for the table
  data?: T[] // Static data array
  reqName?: string // API endpoint name for server-side data
  children: React.ReactNode // Table components
}
```

**Props:**

- `name`: Unique identifier for the table instance
- `data`: Static data array (used when `reqName` is not provided)
- `reqName`: API endpoint name for server-side data fetching
- `children`: Child components (TableHeader, TableBody, etc.)

### TableHeader

Renders sortable column headers.

```tsx
interface TableHeaderProps {
  headers?: ITableHeader[] // Array of header definitions
  children?: React.ReactNode // Custom header content
}

interface ITableHeader {
  title: string // Display text for the header
  sortKey?: string // Sort key optional for the column sort  must to be like backend key
}
```

### TableBody

Renders table rows with custom rendering logic.

```tsx
interface TableBodyProps {
  render: (value: {
    // Render function for each row
    item: any // Current row data
    index: number // Row index
    row_count: number // Total row count
  }) => ReactNode
  columnCount: number // Number of columns for proper structure
}
```

### TablePagination

Handles page navigation and pagination controls.

```tsx
interface TablePaginationProps {
  onPageChange?: (page: number) => void //  Callback when page changes
}
```

### TableAction

Individual action button with predefined variants.

```tsx
interface TableActionProps {
  tableActionVariant?: 'Edit' | 'Delete' | 'View' // Predefined action type
  permissionName?: string // Permission check
  onClick?: () => void // Click handler
  children?: React.ReactNode // Custom content
}
```

**Available Variants:**
you can add like you want new variant this is the default.

- `Edit`: Pencil icon with yellow styling
- `Delete`: Trash icon with red styling
- `View`: Eye icon with blue styling

### TableActionsDropdown

Dropdown menu container for multiple actions.

```tsx
interface TableActionsDropdownProps {
  triggerLabel?: string // Text for the dropdown trigger
  children: React.ReactNode // Action components
  className?: string // Additional CSS classes
}
```

## Data Fetching

The system automatically handles data fetching when `reqName` is provided:

```tsx
// Automatic data fetching from 'users' endpoint
<TableProvider<Users> name="users-table" reqName="users">
  {/* Table components */}
</TableProvider>

// Static data without API calls
<TableProvider<StaticDataType> name="static-table" data={staticData}>
  {/* Table components */}
</TableProvider>
```

## Styling & Customization

### Custom CSS Classes

```tsx
// Custom table styling
<table className="w-full border-collapse border border-gray-300 bg-white shadow-sm">
  <TableHeader headers={headers} className="bg-gray-50" />
  <TableBody
    columnCount={headers.length}
    render={({ item }) => <tr className="hover:bg-blue-50 transition-colors">{/* Row content */}</TableRow>}
  />
</Table>
```

### Custom Action Styling

```tsx
<TableAction tableActionVariant="Edit" className="text-blue-600 hover:text-blue-700 bg-blue-50" onClick={handleEdit} />
```

## Basic Usage

### Simple Static Table

```tsx
import { TableProvider, TableHeader, TableBody } from '@/components/ui/Table'
import { Table, TableRow, TableCell } from '@/components/ui/table'

interface User {
  id: number
  name: string
  email: string
  role: string
}

const users: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
]

function UserTable() {
  const headers = [
    { title: 'ID' },
    { title: 'Name', sortKey: 'name' },
    { title: 'Email' },
    { title: 'Role', sortKey: 'role' },
  ]

  return (
    <QueryProvider isRouteQuery>
      <TableProvider<User> name="users-table" data={data}>
        <Table>
          <TableHeader headers={headers} />
          <TableBody
            columnCount={headers.length}
            render={({ item, row_count }) => (
              <TableRow>
                <TableCell>{row_count}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.role}</TableCell>
              </TableRow>
            )}
          />
        </Table>
      </TableProvider>
    </QueryProvider>
  )
}
```

### Server-Side Data Table with Pagination

```tsx

interface Product {
  id: number
  name: string
  price: number
  category: string
  status: 'active' | 'inactive'
}

function ProductTable() {
  const headers = [
    { title: 'ID' },
    { title: 'Product Name' },
    { title: 'Price', sortKey: 'price' },
    { title: 'Category', sortKey: 'category' },
    { title: 'Status', sortKey: 'status' },
    { title: 'Actions' },
  ]

  const handleEdit = (product: Product) => {
    console.log('Edit product:', product)
  }

  const handleDelete = (product: Product) => {
    console.log('Delete product:', product)
  }

  const handleView = (product: Product) => {
    console.log('View product:', product)
  }

  return (
    <QueryProvider isRouteQuery>
      <TableProvider<Products>
        name="products-table"
        reqName="products" // API endpoint name
      >
            <Table>
              <TableHeader headers={headers} />
              <TableBody
                columnCount={headers.length}
                render={({ item, index }) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>${item.price}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                      <TableActionsDropdown triggerLabel="Actions">
                        <TableAction tableActionVariant="View" onClick={() => handleView(item)} />
                        <TableAction tableActionVariant="Edit" onClick={() => handleEdit(item)} />
                        <TableAction tableActionVariant="Delete" onClick={() => handleDelete(item)} />
                      </TableActionsDropdown>
                  </TableRow>
                )}
              />
            </Table>

          <TablePagination  />
      </TableProvider>
    </QueryProvider>
  )
}
```

### Advanced Table with Custom Actions

```tsx
import React from 'react'
import { TableProvider, TableHeader, TableBody, TableAction } from '@/components/ui/Table'

interface Order {
  id: number
  customerName: string
  total: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  orderDate: string
}

function OrderTable() {
  const headers = [
    { title: 'Order ID', sortKey: 'id' },
    { title: 'Customer', sortKey: 'customerName' },
    { title: 'Total', sortKey: 'total' },
    { title: 'Status', sortKey: 'status' },
    { title: 'Order Date', sortKey: 'orderDate' },
    { title: 'Actions', sortKey: '' },
  ]

  return (
    <QueryProvider isRouteQuery>
      <TableProvider<Orders> name="orders-table" reqName="orders">
          <Table>
            <TableHeader headers={headers} />
            <TableBody
              columnCount={headers.length}
              render={({ item, row_count }) => (
                <TableRow key={item.id} className="border-b border-gray-200">
                  <TableCell>{row_count}</TableCell>
                  <TableCell>{item.customerName}</TableCell>
                  <td className="px-4 py-2 font-semibold">${item.total}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(item.orderDate).toLocaleDateString()}</TableCell>
                  <TableActionsDropdown>
                      <TableAction tableActionVariant="View" onClick={() => console.log('View order:', item)} />
                      <TableAction tableActionVariant="Edit" onClick={() => console.log('Edit order:', item)} />

                  </TableActionsDropdown>
                </TableRow>
              )}
            />
          </Table>
      </TableProvider>
    </QueryProvider>
  )
}
```

### Common Issues

1. **Data not loading**: Check if `reqName` is correctly set and API endpoint exists
2. **Actions not working**: Ensure proper event handlers are passed to `TableAction` components
3. **Styling issues**: Verify CSS classes and Tailwind CSS configuration
4. **Type errors**: Check TypeScript interfaces and generic type usage

### Debug Tips

- Use React DevTools to inspect component hierarchy
- Check browser console for API errors
- Verify data structure matches expected interfaces
- Test with static data before implementing server-side fetching

## Migration Guide

### From Basic HTML Tables

```tsx
// Before: Basic HTML table
<Table>
  <ShadcnTableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </ShadcnTableHeader>
  <ShadcnTableBody>
    {users.map(user => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
      </TableRow>
    ))}
  </ShadcnTableBody>
</Table>

// After: Using Table components
<TableProvider<UserTableType> name="users-table" data={users}>
  <Table>
    <TableHeader headers={[
      { title: 'Name', sortKey: 'name' },
      { title: 'Email', sortKey: 'email' }
    ]} />
    <TableBody
      columnCount={2}
      render={({ item }) => (
        <TableRow>
          <TableCell>{item.name}</TableCell>
          <TableCell>{item.email}</TableCell>
        </TableRow>
      )}
    />
  </Table>
</TableProvider>
```

This comprehensive table system provides enterprise-grade functionality while maintaining clean, maintainable code architecture. It follows SOLID principles and provides a flexible foundation for building complex data presentation interfaces.
