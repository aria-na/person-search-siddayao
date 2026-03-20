export default function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="border-t bg-background py-6 text-center text-sm text-muted-foreground">
      <p>&copy; {currentYear} Ariana Siddayao. All rights reserved.</p>
    </footer>
  )
}

