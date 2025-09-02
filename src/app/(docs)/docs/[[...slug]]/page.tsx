
// src/app/(docs)/docs/[[...slug]]/page.tsx

import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import { DocSidebarNav } from '@/app/(docs)/docs/_components/docs-sidebar-nav';
import { ScrollArea } from '@/components/ui/scroll-area';

const docsDirectory = path.join(process.cwd(), 'docs');

async function getDocContent(slug: string) {
    const fullPath = path.join(docsDirectory, `${slug}.md`);
    try {
        const fileContents = await fs.readFile(fullPath, 'utf8');
        const { content, data } = matter(fileContents);
        return { content, title: data.title };
    } catch (error) {
        return null;
    }
}

async function getDocs() {
    try {
        const files = await fs.readdir(docsDirectory);
        const docs = await Promise.all(files.map(async (file) => {
            const slug = file.replace(/\.md$/, '');
            const fullPath = path.join(docsDirectory, file);
            const fileContents = await fs.readFile(fullPath, 'utf8');
            const { data } = matter(fileContents);
            return {
                title: data.title || slug.replace(/-/g, ' '),
                slug: slug,
                order: data.order || 99,
            };
        }));
        return docs.sort((a, b) => a.order - b.order);
    } catch (error) {
        console.error("Could not read docs directory:", error);
        return [];
    }
}


export default async function DocPage({ params }: { params: { slug?: string[] } }) {
    const slug = params.slug?.join('/') || 'introducao';
    const doc = await getDocContent(slug);
    const allDocs = await getDocs();
    
    if (!doc) {
        notFound();
    }

    return (
        <div className="container mx-auto flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
            <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
                <ScrollArea className="h-full py-6 pr-6 lg:py-8">
                     <DocSidebarNav items={allDocs} />
                </ScrollArea>
            </aside>
            <main className="relative py-6 lg:gap-10 lg:py-8">
                 <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80 prose-a:no-underline">
                    {doc.title && <h1>{doc.title}</h1>}
                    <ReactMarkdown>{doc.content}</ReactMarkdown>
                </div>
            </main>
        </div>
    );
}

export async function generateStaticParams() {
    const docs = await getDocs();
    return docs.map(doc => ({
        slug: doc.slug.split('/'),
    }));
}
