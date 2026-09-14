import type {
  Category,
  CategoryPayload,
  DeleteCategoryResponse,
  RawCategoriesIndexResponse,
  RawCategoryResponse,
} from '@/modules/categories/types/category.types'

const names = [
  ['مجوهرات', 'Jewelry'],
  ['خواتم', 'Rings'],
  ['قلائد', 'Necklaces'],
  ['أزياء', 'Fashion'],
  ['فساتين', 'Dresses'],
  ['أحذية', 'Shoes'],
  ['منزل', 'Home'],
  ['ديكور', 'Decor'],
  ['عطور', 'Perfumes'],
  ['هدايا', 'Gifts'],
  ['إلكترونيات', 'Electronics'],
  ['إكسسوارات', 'Accessories'],
] as const

const parentIds: Array<number | null> = [null, 1, 1, null, 4, 4, null, 7, null, null, null, 11]
const INITIAL_CATEGORIES: Category[] = names.map(([ar, en], index) => {
  const id = index + 1
  return {
    id,
    parent_id: parentIds[index],
    name: { ar, en },
    slug: en.toLowerCase(),
    description: id % 3 === 0 ? null : { ar: `وصف ${ar}`, en: `${en} description` },
    is_active: id !== 9,
    sort_order: id,
    image_url: id % 2 === 0 ? null : `https://picsum.photos/seed/rafal-category-${id}/320/240`,
    children_count: parentIds.filter((parentId) => parentId === id).length,
    created_at: '2026-09-06T20:01:03+00:00',
    updated_at: '2026-09-06T20:01:03+00:00',
  }
})

let categories = INITIAL_CATEGORIES.map(cloneCategory)
let nextId = 13
const PAGE_SIZE = 15
const LATENCY = 180

function cloneCategory(category: Category): Category {
  return {
    ...category,
    name: { ...category.name },
    description: category.description ? { ...category.description } : null,
  }
}

function wait() {
  return new Promise<void>((resolve) => setTimeout(resolve, LATENCY))
}

function timestamp() {
  return new Date().toISOString()
}

function recountChildren() {
  categories = categories.map((category) => ({
    ...category,
    children_count: categories.filter((candidate) => candidate.parent_id === category.id).length,
  }))
}

export function resetCategoriesMock() {
  categories = INITIAL_CATEGORIES.map(cloneCategory)
  nextId = 13
}

export function seedCategoriesMock(nextCategories: Category[]) {
  categories = nextCategories.map(cloneCategory)
  nextId = Math.max(0, ...categories.map((category) => category.id)) + 1
  recountChildren()
}

export const categoriesMockTransport = {
  async list(page: number): Promise<RawCategoriesIndexResponse> {
    await wait()
    const start = (page - 1) * PAGE_SIZE
    return {
      success: true,
      message: 'Categories retrieved successfully',
      data: categories.slice(start, start + PAGE_SIZE).map(cloneCategory),
      meta: {
        current_page: page,
        last_page: Math.max(1, Math.ceil(categories.length / PAGE_SIZE)),
        per_page: PAGE_SIZE,
        total: categories.length,
      },
    }
  },
  async show(id: number): Promise<RawCategoryResponse> {
    await wait()
    const category = categories.find((item) => item.id === id)
    if (!category) throw new Error('Category not found')
    return { success: true, message: 'Category retrieved successfully', data: cloneCategory(category) }
  },
  async create(payload: CategoryPayload): Promise<RawCategoryResponse> {
    await wait()
    const id = nextId++
    const now = timestamp()
    const category: Category = {
      ...payload,
      id,
      name: { ...payload.name },
      description: payload.description ? { ...payload.description } : null,
      image_url: null,
      children_count: 0,
      created_at: now,
      updated_at: now,
    }
    categories.unshift(category)
    recountChildren()
    return {
      success: true,
      message: 'Category created successfully',
      data: {
        ...cloneCategory(category),
        parent_id: category.parent_id === null ? null : String(category.parent_id),
        sort_order: String(category.sort_order),
        description: [],
      },
    }
  },
  async update(id: number, payload: CategoryPayload): Promise<RawCategoryResponse> {
    await wait()
    const index = categories.findIndex((category) => category.id === id)
    if (index < 0) throw new Error('Category not found')
    categories[index] = {
      ...categories[index],
      ...payload,
      name: { ...payload.name },
      description: payload.description ? { ...payload.description } : null,
      updated_at: timestamp(),
    }
    recountChildren()
    return { success: true, message: 'Category updated successfully', data: cloneCategory(categories[index]) }
  },
  async delete(id: number): Promise<DeleteCategoryResponse> {
    await wait()
    categories = categories.filter((category) => category.id !== id)
    recountChildren()
    return { success: true, message: 'Category deleted successfully' }
  },
}
