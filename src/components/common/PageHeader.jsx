import { motion } from 'framer-motion';

export default function PageHeader({ eyebrow = 'Live operational view', title, description, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"
    >
      <div className="max-w-3xl">
        <p className="eyebrow">
          {eyebrow}
          <span className="ml-2 h-1.5 w-1.5 rounded-full bg-saffron" aria-hidden="true" />
        </p>
        <h1 className="page-title">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
