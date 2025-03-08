'use server'
import db from '@/utils/db'

import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { productSchema, imageSchema, validateZodWithSchema } from './schemas'

const renderError = (error: unknown): { message: string } => {
  console.log(error)
  return {
    message: error instanceof Error ? error.message : 'An error occurred',
  }
}

const getAuthUser = async () => {
  const user = await currentUser()
  if (!user) {
    throw new Error('You must be logged in to access this route')
  }
  return user
}

export const fetchFeaturedProducts = async () => {
  const products = await db.product.findMany({
    where: {
      featured: true,
    },
  })
  return products
}

export const fetchAllProducts = ({ search = '' }: { search: string }) => {
  return db.product.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const fetchSingleProduct = async (productId: string) => {
  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  })
  if (!product) redirect('/products')
  return product
}

export const createProductAction = async (
  prevState: any,
  formData: FormData
): Promise<{ message: string }> => {
  const user = await getAuthUser()

  try {
    const rawData = Object.fromEntries(formData)
    const file = formData.get('image') as File
    const validatedFields = validateZodWithSchema(productSchema, rawData)
    const validatedFile = validateZodWithSchema(imageSchema, { image: file })
    console.log(validatedFile)

    await db.product.create({
      data: {
        ...validatedFields,
        image: '/images/product-3.jpg',
        clerkId: user.id,
      },
    })
    return { message: 'product created' }
  } catch (error) {
    return renderError(error)
  }
}
