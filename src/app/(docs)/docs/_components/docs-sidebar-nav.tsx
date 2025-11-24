'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Paper } from '@mui/material';

interface DocsSidebarNavProps {
    items: {
        title: string;
        slug: string;
    }[];
}

export function DocSidebarNav({ items }: DocsSidebarNavProps) {
    const pathname = usePathname();

    if (!items.length) return null;

    return (
        <Box component="nav" sx={{ width: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, px: 2 }}>
                Documentação
            </Typography>
            <List disablePadding>
                {items.map((item) => {
                    const isActive = pathname === `/docs/${item.slug}`;
                    return (
                        <ListItem key={item.slug} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                component={Link}
                                href={`/docs/${item.slug}`}
                                selected={isActive}
                                sx={{
                                    borderRadius: 1,
                                    textTransform: 'capitalize',
                                    py: 1,
                                    px: 2,
                                    '&.Mui-selected': {
                                        bgcolor: 'action.selected',
                                        color: 'primary.main',
                                        fontWeight: 600,
                                        '&:hover': {
                                            bgcolor: 'action.selected',
                                        }
                                    },
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    }
                                }}
                            >
                                <ListItemText 
                                    primary={item.title} 
                                    primaryTypographyProps={{ 
                                        variant: 'body2',
                                        fontWeight: isActive ? 600 : 400
                                    }} 
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
}
