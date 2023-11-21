import { sql } from '@vercel/postgres';
import {
  User,
} from './definitions';
import { unstable_noStore as noStore } from 'next/cache';


const ITEMS_PER_PAGE = 6;
export async function fetchFilteredUsers(
  query: string,
  currentPage: number,
) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
	const users = await sql<UsersTable>`
	  SELECT
		users.id,
		users.name,
		users.email
	  FROM users
	  WHERE
		users.name::text ILIKE ${`%${query}%`} OR
		users.email::text ILIKE ${`%${query}%`}
	  ORDER BY users.name ASC
	  LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
	`;

	return users.rows;
  } catch (error) {
	console.error('Database Error:', error);
	throw new Error('Failed to fetch users.');
  }
}

export async function fetchUsersPages(query: string) {
  noStore();
  try {
	const count = await sql`SELECT COUNT(*)
	FROM users
	WHERE
	  users.name::text ILIKE ${`%${query}%`} OR
	  users.email::text ILIKE ${`%${query}%`}
  `;

	const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
	return totalPages;
  } catch (error) {
	console.error('Database Error:', error);
	throw new Error('Failed to fetch total number of users.');
  }
}

export async function getUser(email: string) {
  noStore();
  try {
	const user = await sql`SELECT * FROM users WHERE email=${email}`;
	return user.rows[0] as User;
  } catch (error) {
	console.error('Failed to fetch user:', error);
	throw new Error('Failed to fetch user.');
  }
}
