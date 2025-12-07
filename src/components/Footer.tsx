export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} R-KIDS Ministry - Ruach South Assembly</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


