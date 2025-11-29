# Intelligent Personal Planning Engine: Technical Specification

This document outlines the technical specifications for the "Intelligent Personal Planning Engine," a core feature of the vtt-labs platform. It's a web application designed to automatically generate a daily and weekly schedule based on user-defined routines, tasks, and constraints, while integrating with their existing Google Calendar.

---

## 1. Project Vision & Mission

- **Vision**: To create a personal operating system that helps users align their daily actions with their long-term goals through intelligent, automated planning and execution tracking.
- **Mission**: Build an MVP of a web application that automatically generates an optimized schedule from routines and tasks, provides tools for tracking execution, and delivers insightful statistics on time management and personal alignment.

---

## 2. Core Features (Modules)

The application will be built around these core, feature-based modules:

### feature/domains
- **Description**: Users can define, create, update, and delete "Domains of Life" (e.g., Spiritual, Professional, Health).
- **Attributes**:
    - `name`: string
    - `color`: string (for visual identification in the UI)

### feature/routines
- **Description**: Users can manage recurring activities (routines).
- **Attributes**:
    - `title`: string
    - `duration`: integer (in minutes)
    - `frequency`: enum (e.g., daily, weekly)
    - `preferred_time_slot`: enum (e.g., morning, afternoon, evening)
    - `domain_id`: foreign key to `domains` table

### feature/tasks
- **Description**: Users can manage one-off tasks.
- **Attributes**:
    - `title`: string
    - `duration`: integer (in minutes)
    - `deadline`: timestamp (optional)
    - `domain_id`: foreign key to `tasks` table

### feature/calendar-sync
- **Description**: Users can connect their Google Calendar via OAuth.
- **Functionality**:
    - The system will read events from the user's primary calendar to identify blocked time slots.
    - These external events are treated as fixed constraints and cannot be moved by the planner.

### feature/schedule-generator
- **Description**: This is the core engine. It generates a daily or weekly schedule.
- **Process**:
    1. Load the user's defined availability (e.g., "work hours").
    2. Place fixed events from Google Calendar.
    3. Place routines in their preferred time slots.
    4. Place tasks in the remaining available time slots.
- **Output**: The generated schedule is stored in the database.

### feature/execution-tracker
- **Description**: On the dashboard or calendar view, users can track their progress.
- **Actions**:
    - Mark scheduled items (routines or tasks) as 'done', 'skipped', or 'partially done'.
- **Data Logging**:
    - The system logs `actual_start` and `actual_end` times to compare planned vs. real execution.

### feature/statistics
- **Description**: A dashboard will display key metrics.
- **Visualizations**:
    - **Time Distribution**: A pie chart showing time spent per domain.
    - **Completion Rate**: Bar charts for routine and task completion percentages.
    - **Alignment Score**: A score that reflects how closely the user followed the planned schedule.

---

## 3. User Flow

1.  **Onboarding**: User signs up and connects their Google Calendar.
2.  **Setup**: User defines their Domains of Life and creates their primary Routines.
3.  **Daily Use**: User adds new Tasks as they arise.
4.  **Planning**: User clicks "Generate Schedule" to get an optimized plan for the day/week.
5.  **Execution**: User follows the schedule and marks items as complete throughout the day.
6.  **Review**: User visits the Statistics page to review their productivity, time allocation, and alignment.

---

## 4. Non-Functional Requirements

- **UI/UX**: The interface must be clean, minimalist, and intuitive, following all principles of the project's constitution (Shadcn UI, mobile-first, a11y, etc.).
- **Performance**: Schedule generation should be fast (under 5 seconds). The UI must be responsive and fluid.
- **Architecture**: The entire system must adhere to the rules defined in `constitution.md` (Next.js 15, Server Actions, Feature-based structure, Supabase RPCs/Views, etc.).