import { Fragment, useState } from 'react'
import styles from 'styles/index.module.css'
import { Client } from '@notionhq/client'
import { useForm } from 'react-hook-form'

const IndexPage = ({ movies, categories }) => {
  const { handleSubmit, register, errors, control } = useForm()
  const [selectedMovie, setSelectedMovie] = useState(null)

  const pickMovie = (data) => {
    const selectedCategories = Object.keys(data).filter((key) => data[key])
    if (selectedCategories.length > 0) {
      const options = movies.filter((movie) =>
        movie.categories.some((category) =>
          selectedCategories.includes(category)
        )
      )
      const randomNumber = Math.floor(Math.random() * options.length)
      setSelectedMovie(options[randomNumber].title)
    } else {
      const randomNumber = Math.floor(Math.random() * movies.length)
      setSelectedMovie(movies[randomNumber].title)
    }
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(pickMovie)} className={styles.form}>
        <div className={styles.categories}>
          {categories.map((category) => (
            <Fragment key={category}>
              <input
                type="checkbox"
                id={category}
                name={category}
                className={styles.input}
                {...register(category)}
              />
              <label htmlFor={category} className={styles.label}>
                {category}
              </label>
            </Fragment>
          ))}
        </div>
        <button className={styles.button}>Choose!</button>
      </form>
      {!!selectedMovie ? (
        <div className={styles.movie}>{selectedMovie}</div>
      ) : null}
    </div>
  )
}

export const getStaticProps = async () => {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  })

  let results = []

  let data = await notion.databases.query({
    database_id: 'f86780796128445aa1c89401244c3f8f',
    filter: {
      property: 'Watched',
      checkbox: {
        equals: false,
      },
    },
  })

  results = [...results, ...data.results]

  while (data.has_more) {
    data = await notion.databases.query({
      database_id: 'f86780796128445aa1c89401244c3f8f',
      filter: {
        property: 'Watched',
        checkbox: {
          equals: false,
        },
      },
      start_cursor: data.next_cursor,
    })
    results = [...results, ...data.results]
  }

  const movies = results.map((result) => ({
    title: result.properties.Title.title[0].plain_text,
    categories: result.properties.Categories.multi_select.map(
      (category) => category.name
    ),
  }))

  const categories = movies.reduce((acc, curr) => {
    curr.categories.forEach((c) => {
      if (!acc.includes(c)) {
        acc.push(c)
      }
    })
    return acc
  }, [])

  return {
    props: {
      movies,
      categories,
    },
    revalidate: 60,
  }
}

export default IndexPage
