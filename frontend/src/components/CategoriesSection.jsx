import { Link } from "react-router-dom";
import "../styles/categories-section.css";

import allModelsImage from "../assets/images/category-all-models.png";
import charactersImage from "../assets/images/category-characters.png";
import animalsImage from "../assets/images/category-animals.png";
import techImage from "../assets/images/category-tech.png";
import environmentImage from "../assets/images/category-environment.png";

import allModelsBg from "../assets/images/category-bg-all-models.png";
import charactersBg from "../assets/images/category-bg-characters.png";
import animalsBg from "../assets/images/category-bg-animals.png";
import techBg from "../assets/images/category-bg-tech.png";
import environmentBg from "../assets/images/category-bg-environment.png";

export default function CategoriesSection() {
  const categories = [
    {
      id: "all",
      title: "Все модели",
      image: allModelsImage,
      bg: allModelsBg,
      className:
        "categories-section__card--large categories-section__card--all",
      to: "/catalog",
    },
    {
      id: "characters",
      title: "Персонажи",
      image: charactersImage,
      bg: charactersBg,
      className:
        "categories-section__card--large categories-section__card--characters",
      to: "/catalog?category=characters",
    },
    {
      id: "animals",
      title: "Животные",
      image: animalsImage,
      bg: animalsBg,
      className: "categories-section__card--animals",
      to: "/catalog?category=animals",
    },
    {
      id: "tech",
      title: "Техника",
      image: techImage,
      bg: techBg,
      className: "categories-section__card--tech",
      to: "/catalog?category=tech",
    },
    {
      id: "environment",
      title: "Окружение",
      image: environmentImage,
      bg: environmentBg,
      className: "categories-section__card--environment",
      to: "/catalog?category=environment",
    },
  ];

  return (
    <section className="categories-section">
      <div className="categories-section__container">
        <h3 className="categories-section__title text-h3">
          Популярные категории
        </h3>

        <div className="categories-section__grid">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={category.to}
              className={`categories-section__card ${category.className}`.trim()}
            >
              <div
                className="categories-section__card-bg"
                style={{ backgroundImage: `url(${category.bg})` }}
              />

              <div className="categories-section__card-content">
                <h4 className="categories-section__card-title text-h4">
                  {category.title}
                </h4>

                <img
                  src={category.image}
                  alt={category.title}
                  className="categories-section__card-image"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
