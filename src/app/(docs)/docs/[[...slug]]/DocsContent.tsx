// src/app/(docs)/docs/[[...slug]]/DocsContent.tsx
'use client';

import React from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import { ScrollArea } from '@/components/mui-wrappers/scroll-area';
import { DocSidebarNav } from '@/app/(docs)/docs/_components/docs-sidebar-nav';
import ReactMarkdown from 'react-markdown';

interface DocsContentProps {
  doc: { title: string; content: string };
  allDocs: { title: string; slug: string; order: number }[];
}

export default function DocsContent({ doc, allDocs }: DocsContentProps) {
  const markdownStyles = {
    '& h1': { fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 700, mb: 4, mt: 2, letterSpacing: '-0.02em' },
    '& h2': { fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 600, mb: 2, mt: 4, borderBottom: 1, borderColor: 'divider', pb: 1 },
    '& h3': { fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 600, mb: 2, mt: 3 },
    '& p': { fontSize: '1rem', lineHeight: 1.7, mb: 2, color: 'text.secondary' },
    '& ul, & ol': { pl: 4, mb: 2 },
    '& li': { mb: 1, color: 'text.secondary' },
    '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
    '& code': { bgcolor: 'action.hover', color: 'text.primary', px: 0.5, py: 0.25, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875em' },
    '& pre': { bgcolor: 'grey.900', color: 'grey.100', p: 2, borderRadius: 2, overflow: 'auto', mb: 3, '& code': { bgcolor: 'transparent', color: 'inherit', p: 0 } },
    '& blockquote': { borderLeft: 4, borderColor: 'primary.main', pl: 2, ml: 0, my: 2, fontStyle: 'italic', color: 'text.secondary' },
    '& img': { maxWidth: '100%', height: 'auto', borderRadius: 2, my: 2 },
  } as const;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
      <Grid container spacing={4}>
        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 3, lg: 2 }} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ position: 'sticky', top: 80, height: 'calc(100vh - 100px)' }}>
            <ScrollArea sx={{ height: '100%', pr: 2 }}>
              <DocSidebarNav items={allDocs} />
            </ScrollArea>
          </Box>
        </Grid>
        {/* Main Content */}
        <Grid size={{ xs: 12, md: 9, lg: 10 }}>
          <Box sx={markdownStyles}>
            {doc.title && (
              <Typography variant="h1" component="h1" sx={{ mb: 4 }}>
                {doc.title}
              </Typography>
            )}
            <ReactMarkdown>{doc.content}</ReactMarkdown>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
