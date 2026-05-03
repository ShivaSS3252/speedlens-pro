import { gql } from '@apollo/client';

export const ANALYZE_WEBSITE = gql`
  mutation AnalyzeWebsite($url: String!) {
    analyzeWebsite(url: $url) {
      id
      url
      mobileScore
      desktopScore
      techStack
      createdAt
      issues {
        id
        title
        description
        displayValue
      }
      suggestions {
        id
        title
        description
      }
    }
  }
`;

export const GET_REPORT = gql`
  query GetReport($id: ID!) {
    getReport(id: $id) {
      id
      url
      mobileScore
      desktopScore
      techStack
      createdAt
      issues {
        id
        title
        description
        displayValue
      }
      suggestions {
        id
        title
        description
      }
    }
  }
`;

export const GENERATE_FIX = gql`
  mutation GenerateFix($title: String!, $description: String!, $displayValue: String, $techStack: String!) {
    generateFix(title: $title, description: $description, displayValue: $displayValue, techStack: $techStack) {
      language
      code
      explanation
    }
  }
`;

export const GET_HISTORY = gql`
  query GetHistory($url: String!) {
    getHistory(url: $url) {
      id
      mobileScore
      desktopScore
      createdAt
    }
  }
`;
