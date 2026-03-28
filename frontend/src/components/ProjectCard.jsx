// src/components/ProjectCard.jsx
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';

const ProjectCard = ({ project }) => {
  const [{ xys }, set] = useSpring(() => ({ xys: [0, 0, 1], config: { mass: 5, tension: 350, friction: 40 } }));

  const calc = (x, y) => [-(y - window.innerHeight / 2) / 100, (x - window.innerWidth / 2) / 100, 1.05];
  const trans = (x, y, s) => `perspective(600px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`;

  return (
    <animated.div
      onMouseMove={({ clientX: x, clientY: y }) => set({ xys: calc(x, y) })}
      onMouseLeave={() => set({ xys: [0, 0, 1] })}
      style={{ transform: xys.to(trans) }}
      className="p-6 rounded-2xl"
    >
      <h3 className="text-xl font-bold text-white">{project.name}</h3>
      <p className="text-gray-300 mt-2 text-sm line-clamp-2">{project.description}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-cyan-400 font-mono">Score: {project.overall_score}</span>
        <span className="text-gray-400 text-xs">ID: {project.id}</span>
      </div>
    </animated.div>
  );
};

export default ProjectCard;