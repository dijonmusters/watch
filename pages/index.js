import { Fragment, useState } from 'react'
import styles from 'styles/index.module.css'
import { Client } from '@notionhq/client'
import { useForm } from 'react-hook-form'
import { FiCheckSquare, FiSquare } from 'react-icons/fi'
import axios from 'axios'

const IndexPage = ({ allMovies, categories }) => {
  const [movies, setMovies] = useState(allMovies)
  const { handleSubmit, register } = useForm()
  const [selectedMovie, setSelectedMovie] = useState()

  const pickMovie = (data) => {
    const selectedCategories = Object.keys(data).filter((key) => data[key])
    if (selectedCategories.length > 0) {
      const options = movies.filter((movie) =>
        movie.categories.some((category) =>
          selectedCategories.includes(category)
        )
      )
      const randomNumber = Math.floor(Math.random() * options.length)
      setSelectedMovie(options[randomNumber])
    } else {
      const randomNumber = Math.floor(Math.random() * movies.length)
      setSelectedMovie(movies[randomNumber])
    }
  }

  const handleWatchToggle = async () => {
    const isWatched = !selectedMovie.isWatched
    const movie = movies.find((m) => m.id === selectedMovie.id)
    movie.isWatched = isWatched
    setMovies(movies)
    setSelectedMovie((current) => ({ ...current, isWatched }))

    await axios.post('/api/mark-as-watched', {
      id: selectedMovie.id,
      isWatched,
    })
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
        <div className={styles.moviePanel}>
          <div className={styles.heading}>
            <button className={styles.icon} onClick={handleWatchToggle}>
              {selectedMovie.isWatched ? <FiCheckSquare /> : <FiSquare />}
            </button>
            <div className={styles.movieTitle} onClick={handleWatchToggle}>
              {selectedMovie.title}
            </div>
          </div>
          <button
            className={styles.chooseAgain}
            onClick={handleSubmit(pickMovie)}
          >
            Choose again
          </button>
        </div>
      ) : null}
    </div>
  )
}

export const getStaticProps = async () => {
  const notion = new Client({
    auth: process.env.NOTION_SECRET,
  })

  let results = []

  let data = await notion.databases.query({
    database_id: process.env.DATABASE_ID,
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
      database_id: process.env.DATABASE_ID,
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

  const allMovies = results.map((result) => ({
    id: result.id,
    title: result.properties.Title.title[0].plain_text,
    categories: result.properties.Categories.multi_select.map(
      (category) => category.name
    ),
  }))

  const categories = allMovies.reduce((acc, curr) => {
    curr.categories.forEach((c) => {
      if (!acc.includes(c)) {
        acc.push(c)
      }
    })
    return acc
  }, [])

  return {
    props: {
      allMovies,
      categories,
    },
    revalidate: 60,
  }
}

export default IndexPage
