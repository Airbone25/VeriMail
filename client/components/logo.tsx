import Link from "next/link";
import { Zap } from "lucide-react";

function Logo() {
    return (
        <div className="p-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display text-lg font-bold tracking-tight">VeriMail</span>
            </Link>
        </div>
    )
}

export default Logo