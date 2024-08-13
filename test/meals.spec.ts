import { execSync } from 'child_process'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { app } from '../src/app'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    await request(app.server)
      .post('/users/register')
      .send({
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: '123456789',
      })
      .expect(201)

    const loginResponse = await request(app.server)
      .post('/users/login')
      .send({
        email: 'johndoe@gmail.com',
        password: '123456789',
      })
      .expect(201)

    await request(app.server)
      .post('/meals/register')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .send({
        name: 'Breakfast',
        description: "It's a breakfast",
        date_time: '2024-08-01T06:50:00+03:00',
        is_diet: true,
      })
      .expect(201)
  })

  it('should be able to list all meals from a user', async () => {
    await request(app.server)
      .post('/users/register')
      .send({
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: '123456789',
      })
      .expect(201)

    const loginResponse = await request(app.server)
      .post('/users/login')
      .send({
        email: 'johndoe@gmail.com',
        password: '123456789',
      })
      .expect(201)

    await request(app.server)
      .post('/meals/register')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .send({
        name: 'Lunch',
        description: "It's a Lunch",
        date_time: '2024-08-01T06:50:00+03:00',
        is_diet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals/register')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .send({
        name: 'Breakfast',
        description: "It's a breakfast",
        date_time: '2024-08-02T06:50:00+03:00',
        is_diet: true,
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .expect(200)

    expect(mealsResponse.body).toHaveLength(2)

    // This validate if the order is correct
    expect(mealsResponse.body[0].name).toBe('Lunch')
    expect(mealsResponse.body[1].name).toBe('Breakfast')
  })

  it('should be able to show a single meal', async () => {
    await request(app.server)
      .post('/users/register')
      .send({
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: '123456789',
      })
      .expect(201)

    const loginResponse = await request(app.server)
      .post('/users/login')
      .send({
        email: 'johndoe@gmail.com',
        password: '123456789',
      })
      .expect(201)

    await request(app.server)
      .post('/meals/register')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .send({
        name: 'Breakfast',
        description: "It's a Breakfast",
        date_time: '2024-08-01T06:50:00+03:00',
        is_diet: true,
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .expect(200)

    const mealId = mealsResponse.body[0].id

    const mealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .expect(200)

    expect(mealResponse.body).toEqual(
      expect.objectContaining({
        id: mealId,
        name: 'Breakfast',
        description: "It's a Breakfast",
        date_time: '2024-08-01T06:50:00+03:00',
        is_diet: true,
      }),
    )
  })

  it('should be able to update a meal from a user', async () => {
    await request(app.server)
      .post('/users/register')
      .send({
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: '123456789',
      })
      .expect(201)

    const loginResponse = await request(app.server)
      .post('/users/login')
      .send({
        email: 'johndoe@gmail.com',
        password: '123456789',
      })
      .expect(201)

    await request(app.server)
      .post('/meals/register')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .send({
        name: 'Breakfast',
        description: "It's a Breakfast",
        date_time: '2024-08-01T06:50:00+03:00',
        is_diet: true,
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .expect(200)

    const mealId = mealsResponse.body[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .send({
        name: 'Dinner',
        description: "It's a dinner",
        date_time: '2024-08-04T06:50:00+03:00',
        is_diet: true,
      })
      .expect(200)
  })

  it('should be able to delete a meal from a user', async () => {
    await request(app.server)
      .post('/users/register')
      .send({
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: '123456789',
      })
      .expect(201)

    const loginResponse = await request(app.server)
      .post('/users/login')
      .send({
        email: 'johndoe@gmail.com',
        password: '123456789',
      })
      .expect(201)

    await request(app.server)
      .post('/meals/register')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .send({
        name: 'Breakfast',
        description: "It's a Breakfast",
        date_time: '2024-08-01T06:50:00+03:00',
        is_diet: true,
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .expect(200)

    const mealId = mealsResponse.body[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .expect(204)
  })

  it('should be able to get metrics from a user', async () => {
    await request(app.server)
      .post('/users/register')
      .send({
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        password: '123456789',
      })
      .expect(201)

    const loginResponse = await request(app.server)
      .post('/users/login')
      .send({
        email: 'johndoe@gmail.com',
        password: '123456789',
      })
      .expect(201)

    await request(app.server)
      .post('/meals/register')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .send({
        name: 'Breakfast',
        description: "It's a Breakfast",
        date_time: '2024-06-01T06:50:00+03:00',
        is_diet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals/register')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .send({
        name: 'Lunch',
        description: "It's a lunch",
        date_time: '2024-08-02T06:50:00+03:00',
        is_diet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals/register')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .send({
        name: 'Snack',
        description: "It's a Snack",
        date_time: '2024-08-03T06:50:00+03:00',
        is_diet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals/register')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .send({
        name: 'Dinner',
        description: "It's a Dinner",
        date_time: '2024-08-04T06:50:00+03:00',
        is_diet: true,
      })
      .expect(201)

    await request(app.server)
      .post('/meals/register')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .send({
        name: 'Breakfast',
        description: "It's a Breakfast",
        date_time: '2024-08-04T09:50:00+03:00',
        is_diet: true,
      })
      .expect(201)

    const metricsResponse = await request(app.server)
      .get('/meals/summary')
      .set('Cookie', loginResponse.get('Set-Cookie')!)
      .expect(200)

    expect(metricsResponse.body).toEqual({
      totalMeals: 5,
      totalMealsInDiet: 5,
      totalMealsOutDiet: 0,
      bestOnDietSequence: 5,
    })
  })
})
