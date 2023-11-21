'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Validate form input
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
	invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
	.number()
	.gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
	invalid_type_error: 'Please select an user status.',
  }),
  date: z.string(),
});

export type State = {
  errors?: {
	customerId?: string[];
	amount?: string[];
	status?: string[];
  };
  message?: string | null;
};


// Create User
const CreateUser = FormSchema.omit({ id: true, date: true });

export async function createUser(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateUser.safeParse({
	customerId: formData.get('customerId'),
	amount: formData.get('amount'),
	status: formData.get('status'),
  });
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
	return {
	  errors: validatedFields.error.flatten().fieldErrors,
	  message: 'Missing Fields. Failed to Create User.',
	};
  }
 
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
 
  // Insert data into the database
  try {
	await sql`
	  INSERT INTO users (customer_id, amount, status, date)
	  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
	`;
  } catch (error) {
	// If a database error occurs, return a more specific error.
	return {
	  message: 'Database Error: Failed to Create User.',
	};
  }
 
  // Revalidate the cache for the users page and redirect the user.
  revalidatePath('/dashboard/users');
  redirect('/dashboard/users');
}


// Update User
const UpdateUser = FormSchema.omit({ id: true, date: true });

export async function updateUser(id: string, prevState: State, formData: FormData,) {
  const validatedFields = UpdateUser.safeParse({
	customerId: formData.get('customerId'),
	amount: formData.get('amount'),
	status: formData.get('status'),
  });
 
  if (!validatedFields.success) {
	return {
	  errors: validatedFields.error.flatten().fieldErrors,
	  message: 'Missing Fields. Failed to Update User.',
	};
  }
 
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
 
  try {
	await sql`
	  UPDATE users
	  SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
	  WHERE id = ${id}
	`;
  } catch (error) {
	return { message: 'Database Error: Failed to Update User.' };
  }
 
  revalidatePath('/dashboard/users');
  redirect('/dashboard/users');
}


// Delete user
export async function deleteUser(id: string) {
  
  try {
  await sql`DELETE FROM users WHERE id = ${id}`;
  revalidatePath('/dashboard/users');
  } catch (error) {
	return { message: 'Database Error: Failed to Delete User.' };
  }
}