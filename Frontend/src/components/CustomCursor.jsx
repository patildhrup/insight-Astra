import { motion } from "framer-motion";

export default function CustomCursor({ x, y, label = "AI Shield", isVisible }) {
    return (
        <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[100] flex items-start gap-1"
            animate={{
                x: x,
                y: y,
                opacity: isVisible ? 1 : 0,
                scale: isVisible ? 1 : 0.5,
            }}
            transition={{
                type: "spring",
                damping: 25,
                stiffness: 250,
                mass: 0.5,
            }}
        >
            {/* Custom Arrow Shape */}
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-sm"
            >
                <path
                    d="M3 3L21 12L12 15L9 21L3 3Z"
                    fill="#DD2C00"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
            </svg>

            {/* Label */}
            <div className="bg-[#DD2C00] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border-2 border-white whitespace-nowrap -translate-y-2 translate-x-1">
                {label}
            </div>
        </motion.div>
    );
}
