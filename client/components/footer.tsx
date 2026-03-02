import { Zap, Globe } from "lucide-react"

export default function Footer() {
    return (
        <footer className="border-t border-border py-12">
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    <span className="font-display font-bold">VeriMail</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                    <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                    <a href="#" className="hover:text-foreground transition-colors">Docs</a>
                    <a href="#" className="hover:text-foreground transition-colors">Status</a>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    © 2025 VeriMail. All rights reserved.
                </p>
            </div>
        </footer>
    )
}
