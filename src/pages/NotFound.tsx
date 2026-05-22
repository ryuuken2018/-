import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Compass } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="card-flat bg-card text-center max-w-md p-8"
      >
        <span className="text-8xl block select-none mb-6">🔍</span>
        <h1 className="text-3xl font-black text-foreground">迷路的萌宠!</h1>
        <p className="text-sm font-bold text-foreground/60 mt-3 mb-6">
          哎呀，这只小萌宠好像跑进森林深处了，我们找不到这个页面！
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="btn-push px-5 py-2.5 text-sm flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>返回班级首页</span>
          </Link>
          <Link
            to="/garden"
            className="btn-push-secondary px-5 py-2.5 text-sm flex items-center justify-center gap-1.5"
          >
            <Compass className="w-4 h-4 text-emerald-100" />
            <span>前往花草园找找</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
export default NotFound;
