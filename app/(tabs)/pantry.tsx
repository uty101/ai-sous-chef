import AsyncStorage from '@react-native-async-storage/async-storage';
import { brandType } from '@/constants/brand';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';

type QuickMeal = {
  title: string;
  cuisine: string;
  timeMinutes: number;
  description: string;
  steps: string[];
  keys: string[];
  accent: string;
  bg: string;
};

const QUICK_MEALS: QuickMeal[] = [
  {
    title: 'Garlic Egg Fried Rice',
    cuisine: 'Chinese',
    timeMinutes: 12,
    description: 'Leftover rice tossed in a hot wok with egg, garlic and soy. Ready in minutes.',
    steps: [
      'Heat a splash of oil in a wok or large pan on high heat.',
      'Add minced garlic and fry 30 seconds until fragrant.',
      'Push to the side, crack in eggs and scramble lightly.',
      'Add cold cooked rice, breaking up any clumps.',
      'Splash in soy sauce, toss everything together for 2–3 minutes.',
    ],
    keys: ['rice', 'eggs', 'garlic', 'soy sauce'],
    accent: '#FFBA35',
    bg: '#FFF3D0',
  },
  {
    title: 'Spicy Chickpea Stir-Fry',
    cuisine: 'Lebanese',
    timeMinutes: 15,
    description: 'Crispy chickpeas with chilli and garlic. Great over rice or scooped with flatbread.',
    steps: [
      'Drain and dry chickpeas well with a paper towel.',
      'Heat oil in a pan over high heat. Add chickpeas, cook 5–6 min until crispy.',
      'Add garlic and chilli flakes, stir 1 minute.',
      'Season with salt and a squeeze of lemon if you have one.',
      'Serve over rice or with bread.',
    ],
    keys: ['chickpeas', 'garlic', 'chilli flakes'],
    accent: '#FF5C35',
    bg: '#FFE8E2',
  },
  {
    title: 'One-Pan Tomato Chicken',
    cuisine: 'Greek',
    timeMinutes: 25,
    description: 'Chicken thighs braised with tomatoes and garlic. Simple, hearty, no-fuss.',
    steps: [
      'Season chicken with salt and pepper.',
      'Brown in an oiled pan 4 min per side, remove and set aside.',
      'Add garlic to pan, cook 1 min. Add chopped tomatoes.',
      'Nestle chicken back in, cover and simmer 15 minutes.',
      'Taste for seasoning and serve straight from the pan.',
    ],
    keys: ['chicken', 'tomatoes', 'garlic'],
    accent: '#FF5C35',
    bg: '#FFE8E2',
  },
  {
    title: 'Spinach & Egg Scramble',
    cuisine: 'French',
    timeMinutes: 10,
    description: 'Wilted spinach folded into soft scrambled eggs. Fast, filling, done.',
    steps: [
      'Heat a little oil or butter in a pan over medium heat.',
      'Add spinach and cook until just wilted, about 2 minutes.',
      'Beat eggs with a pinch of salt, pour into the pan.',
      'Stir gently with a spatula until just set. Keep them soft.',
      'Season and eat immediately.',
    ],
    keys: ['spinach', 'eggs'],
    accent: '#34A853',
    bg: '#E8F8EE',
  },
  {
    title: 'Pasta Aglio e Olio',
    cuisine: 'Italian',
    timeMinutes: 15,
    description: 'Spaghetti with olive oil, garlic and chilli. The most satisfying pantry pasta.',
    steps: [
      'Cook pasta in well-salted boiling water until al dente. Reserve a cup of pasta water.',
      'Heat olive oil gently in a pan, add sliced garlic and chilli flakes.',
      'Cook 2 min until garlic is just golden. Do not burn.',
      'Add drained pasta and a splash of pasta water. Toss vigorously.',
      'Serve immediately with extra chilli if you like.',
    ],
    keys: ['pasta', 'garlic', 'olive oil', 'chilli flakes'],
    accent: '#3B82F6',
    bg: '#EBF3FF',
  },
  {
    title: 'Yogurt Flatbread with Garlic',
    cuisine: 'Turkish',
    timeMinutes: 20,
    description: 'Two-ingredient flatbreads from yogurt and flour. Fresher and faster than you think.',
    steps: [
      'Mix 200g Greek yogurt with 200g self-raising flour (or plain flour + pinch of baking powder). Knead into a soft dough.',
      'Divide into 4 balls, roll each thin.',
      'Dry-fry in a hot pan 2 min per side until charred spots form.',
      'Brush with garlic-infused oil and a sprinkle of salt.',
      'Serve warm with anything you have.',
    ],
    keys: ['greek yogurt', 'garlic'],
    accent: '#7C3AED',
    bg: '#F0EBFF',
  },
  {
    title: 'Tomato & Egg Drop Soup',
    cuisine: 'Chinese',
    timeMinutes: 10,
    description: 'A silky, warming soup from just tomatoes and eggs. A Chinese home staple.',
    steps: [
      'Chop tomatoes and fry in oil for 3 minutes until they break down.',
      'Add 500ml water or stock, bring to a gentle simmer.',
      'Beat 2 eggs and pour slowly into the simmering soup in a thin stream, stirring gently.',
      'Season with soy sauce, salt and a drop of sesame oil if you have it.',
      'Serve immediately.',
    ],
    keys: ['tomatoes', 'eggs', 'soy sauce'],
    accent: '#FF5C35',
    bg: '#FFE8E2',
  },
  {
    title: 'Garlicky Soy Chicken',
    cuisine: 'Japanese',
    timeMinutes: 20,
    description: 'Chicken thighs glazed in a sticky soy-garlic sauce. Pairs perfectly with rice.',
    steps: [
      'Mix 3 tbsp soy sauce with 1 tsp sugar or honey.',
      'Heat oil in a pan, add chicken skin-side down. Cook 6 min until golden.',
      'Flip, add garlic, cook 2 more minutes.',
      'Pour in soy mix, let it bubble and reduce into a glaze, about 3 minutes.',
      'Serve over rice with the pan juices.',
    ],
    keys: ['chicken', 'soy sauce', 'garlic', 'rice'],
    accent: '#FFBA35',
    bg: '#FFF3D0',
  },
];

