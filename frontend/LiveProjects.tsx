"use client";

import { useEffect, useState } from "react";

type Project = {
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
};

export default function LiveProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((response) => {
        if (!response.ok) throw new Error("Projects API unavailable");
        return response.json();
      })
      .then((data: { projects?: Project[] }) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading live GitHub projects…</p>;
  if (!projects.length) return <p>Project data is temporarily unavailable.</p>;

  return (
    <div className="live-project-grid">
      {projects.map((project) => (
        <article className="live-project" key={project.url}>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
          <small>{project.language} · ★ {project.stars}</small>
          <a href={project.url} target="_blank" rel="noreferrer">View project ↗</a>
        </article>
      ))}
    </div>
  );
}
